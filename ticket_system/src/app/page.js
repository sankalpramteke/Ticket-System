"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { apiFetch, getToken } from "@/lib/clientAuth";

export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      const token = getToken();
      if (!token) { setUser(null); return; }
      try {
        const { user } = await apiFetch("/api/auth/me");
        setUser(user);
      } catch { setUser(null); }
    })();
  }, []);

  return (
    <div className="space-y-10">
      <section className="rounded-xl bg-white border shadow-sm p-8">
        <h1 className="text-3xl font-semibold text-slate-900">Campus Ticket Management</h1>
        <p className="mt-2 text-slate-600 max-w-2xl">Report issues, assign to the right staff, and track progress in one place.</p>
        <div className="mt-6 flex gap-3">
          {!user && (
            <>
              <Button as="a" href="/login">Login</Button>
              <Link className="self-center text-sm text-slate-600 underline" href="/login">New here? Create an account</Link>
            </>
          )}
          {user?.role === 'reporter' && (
            <>
              <Button as="a" href="/tickets/new">Create Ticket</Button>
              <Button as="a" href="/tickets/mine" className="bg-white text-slate-900 border">My Tickets</Button>
            </>
          )}
          {user?.role === 'admin' && (
            <Button as="a" href="/admin">Open Admin Dashboard</Button>
          )}
          {user?.role === 'technician' && (
            <Button as="a" href="/tech">View My Assignments</Button>
          )}
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4">
          <h3 className="font-medium">Raise Issues Fast</h3>
          <p className="text-sm text-gray-600 mt-1">Submit AC, Computer, Electrical, or other campus issues with priority.</p>
        </div>
        <div className="border rounded-lg p-4">
          <h3 className="font-medium">Assign & Track</h3>
          <p className="text-sm text-gray-600 mt-1">Admins assign tickets to the right technician and monitor progress.</p>
        </div>
        <div className="border rounded-lg p-4">
          <h3 className="font-medium">Resolve & Close</h3>
          <p className="text-sm text-gray-600 mt-1">Technicians update status; reporters can confirm and close.</p>
        </div>
      </section>
    </div>
  );
}
