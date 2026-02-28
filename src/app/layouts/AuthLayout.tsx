import React, { ReactNode } from "react";
import { Shield } from "lucide-react";

export const AuthLayout = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen bg-gradient-to-br from-[#1E293B] via-[#1E3A8A] to-[#1E293B] flex items-center justify-center p-4 animate-in fade-in duration-500">
    {/* Background pattern */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full border border-white/5"
          style={{
            width: `${(i + 1) * 200}px`,
            height: `${(i + 1) * 200}px`,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}
    </div>

    <div className="relative w-full max-w-4xl flex rounded-3xl overflow-hidden shadow-2xl bg-white animate-in zoom-in-95 fade-in duration-500 delay-150">
      {/* Left Brand Panel */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-[#1E3A8A] to-[#1E293B] w-96 p-10 text-white flex-shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-lg leading-tight">LeaveMS</p>
              <p className="text-xs text-blue-300">Leave Management System</p>
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-3 leading-snug">Streamline Your Leave Management</h2>
          <p className="text-blue-200 text-sm leading-relaxed">
            A comprehensive platform for employees, managers, and HR teams to manage leave requests efficiently.
          </p>
        </div>

        <div className="space-y-4">
          {[
            { emoji: "📋", title: "Easy Applications", desc: "Apply for leave in seconds with auto balance validation" },
            { emoji: "✅", title: "Role-Based Approvals", desc: "Multi-level approval workflow with instant notifications" },
            { emoji: "📊", title: "Analytics Dashboard", desc: "Track leave patterns and team availability at a glance" },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">{f.emoji}</span>
              <div>
                <p className="font-semibold text-sm">{f.title}</p>
                <p className="text-blue-300 text-xs mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-xs text-blue-400 mt-8">
          <p className="mb-2 font-semibold text-blue-300">Demo Credentials:</p>
          {[
            ["Employee", "employee@demo.com"],
            ["Manager", "manager@demo.com"],
            ["HR Admin", "admin@demo.com"],
          ].map(([role, email]) => (
            <div key={role} className="flex justify-between mb-1">
              <span className="text-blue-300">{role}:</span>
              <span>{email}</span>
            </div>
          ))}
          <p className="mt-1 text-blue-400">Password: <span className="text-blue-200">password</span></p>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 p-8 md:p-12 flex flex-col justify-center">{children}</div>
    </div>
  </div>
);
