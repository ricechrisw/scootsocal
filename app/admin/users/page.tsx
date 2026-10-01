import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAdminUser, deleteAdminUser, updateAdminUser } from "../actions";

export const dynamic = "force-dynamic";

export default async function StaffUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const session = await requireAdmin();
  const sp = await searchParams;
  const users = await prisma.adminUser.findMany({
    select: { id: true, name: true, email: true },
    orderBy: [{ name: "asc" }, { email: "asc" }],
  });
  const onlyOne = users.length <= 1;

  return (
    <main id="main" className="section">
      <div className="wrap">
        <h1>Staff logins</h1>
        <p className="note">
          These accounts sign in to the admin dashboard with email and password. Name is how you tell people apart.
        </p>
        {sp.ok ? <p className="banner">{sp.ok}</p> : null}
        {sp.error ? (
          <p className="error" role="alert">
            {sp.error}
          </p>
        ) : null}

        <h2>Add staff user</h2>
        <form className="form-panel" action={createAdminUser}>
          <label>
            Name
            <input name="name" autoComplete="name" minLength={2} maxLength={80} required />
          </label>
          <label>
            Email
            <input name="email" type="email" autoComplete="off" required />
          </label>
          <div className="form-row staff-user-pass">
            <label>
              Password
              <input name="password" type="password" autoComplete="new-password" minLength={8} required />
            </label>
            <label>
              Confirm password
              <input name="confirm" type="password" autoComplete="new-password" minLength={8} required />
            </label>
          </div>
          <p className="note">At least 8 characters.</p>
          <button className="btn btn-citrus" type="submit">
            Add staff user
          </button>
        </form>

        <h2>Existing users</h2>
        {users.map((u) => {
          const self = u.email === session.email;
          return (
            <section key={u.id} className="form-panel staff-user-card">
              <p className="staff-user-who">
                {self ? <span className="staff-user-you">You</span> : null}
                <span>{u.name?.trim() || "Unnamed"}</span>
                <span className="staff-user-email">{u.email}</span>
              </p>
              <form action={updateAdminUser}>
                <input type="hidden" name="id" value={u.id} />
                <label>
                  Name
                  <input name="name" defaultValue={u.name} autoComplete="name" minLength={2} maxLength={80} required />
                </label>
                <label>
                  Email
                  <input name="email" type="email" defaultValue={u.email} required />
                </label>
                <div className="form-row staff-user-pass">
                  <label>
                    New password
                    <input name="password" type="password" autoComplete="new-password" minLength={8} />
                  </label>
                  <label>
                    Confirm new password
                    <input name="confirm" type="password" autoComplete="new-password" minLength={8} />
                  </label>
                </div>
                <p className="note">Leave password blank to keep the current one.</p>
                <button className="btn btn-navy" type="submit">
                  Save
                </button>
              </form>
              <form action={deleteAdminUser}>
                <input type="hidden" name="id" value={u.id} />
                <button className="btn btn-ghost" type="submit" disabled={self || onlyOne}>
                  Remove
                </button>
                {self ? <p className="note">Sign in as someone else to remove this account.</p> : null}
                {onlyOne && !self ? <p className="note">Keep at least one staff login.</p> : null}
              </form>
            </section>
          );
        })}
      </div>
    </main>
  );
}
