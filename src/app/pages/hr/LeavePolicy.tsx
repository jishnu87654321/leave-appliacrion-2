import React, { useState } from "react";
import { Pencil, Save, X, Info, ToggleLeft, ToggleRight } from "lucide-react";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { Modal } from "../../components/Modal";
import { useLeave } from "../../context/LeaveContext";

export default function LeavePolicy() {
  const { leaveTypes, updateLeaveType } = useLeave();
  const [editingType, setEditingType] = useState<any | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [saved, setSaved] = useState(false);

  const startEdit = (lt: any) => {
    setEditingType(lt);
    setFormData({ ...lt });
    setSaved(false);
  };

  const handleSave = async () => {
    if (!editingType) return;
    try {
      const result = await updateLeaveType(editingType._id || editingType.id, formData);
      if (result.success) {
        setEditingType(null);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert(result.message || "Failed to update leave type.");
      }
    } catch (error: any) {
      console.error("Error updating leave type:", error);
      alert(error?.response?.data?.message || error?.message || "Failed to update leave type.");
    }
  };

  const Field = ({ label, field, type = "text", min, max, step }: { label: string; field: string; type?: string; min?: number; max?: number; step?: number }) => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <input
        type={type} value={(formData[field] as string | number) ?? ""}
        onChange={(e) => setFormData((p: any) => ({ ...p, [field]: type === "number" ? parseFloat(e.target.value) : e.target.value }))}
        min={min} max={max} step={step}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
      />
    </div>
  );

  const Toggle = ({ label, field, desc }: { label: string; field: "allowNegativeBalance" | "applicableDuringProbation" | "requiresDocument"; desc?: string }) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
      <div>
        <p className="text-sm font-semibold text-gray-700">{label}</p>
        {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
      </div>
      <button onClick={() => setFormData((p: any) => ({ ...p, [field]: !p[field] }))}
        className={`transition-colors ${formData[field] ? "text-blue-600" : "text-gray-300"}`}>
        {formData[field] ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
      </button>
    </div>
  );

  return (
    <DashboardLayout title="Leave Policies" subtitle="Configure leave types, accruals, and rules" allowedRoles={["HR_ADMIN", "MANAGER"]}>
      {saved && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-5">
          ✅ Leave policy updated successfully!
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {leaveTypes.map((lt) => (
          <div key={lt.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-2 w-full" style={{ backgroundColor: lt.color }} />
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="inline-block text-white text-xs font-bold px-2.5 py-1 rounded-full mb-1.5" style={{ backgroundColor: lt.color }}>{lt.code}</span>
                  <h3 className="font-bold text-gray-900">{lt.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{lt.description}</p>
                </div>
                <button onClick={() => startEdit(lt)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0">
                  <Pencil className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  ["Accrual Type", lt.accrualType],
                  ["Accrual Rate", `${lt.accrualRate} days/${lt.accrualType === "MONTHLY" ? "month" : "year"}`],
                  ["Carry Forward Limit", lt.carryForwardLimit > 0 ? `${lt.carryForwardLimit} days` : "None"],
                  ["Max Consecutive Days", `${lt.maxConsecutiveDays} days`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center py-1 border-b border-gray-50 last:border-0">
                    <span className="text-gray-500">{k}</span>
                    <span className="font-semibold text-gray-800">{v}</span>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {lt.allowNegativeBalance && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Neg. Balance OK</span>}
                {lt.applicableDuringProbation && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Probation OK</span>}
                {lt.requiresDocument && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Doc Required</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-100 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-blue-900 text-sm mb-1.5">Policy Guidelines</h4>
            <ul className="space-y-1 text-xs text-blue-700">
              <li>• Changes to leave policies take effect immediately for new requests.</li>
              <li>• Existing approved leaves are not affected by policy changes.</li>
              <li>• Accrual rates are applied during the monthly/yearly cron job.</li>
              <li>• Probation rules apply to employees within their first 6 months.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Approval Workflow Config */}
      <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-bold text-gray-900 mb-4">Approval Workflow Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: "Single Level Approval", desc: "Manager approves directly — no HR involvement", active: true },
            { label: "Multi-Level Approval", desc: "Manager approves, then HR confirms", active: false },
            { label: "Auto-Approval for WFH", desc: "Work from home auto-approved without manager", active: false },
            { label: "HR Override Allowed", desc: "HR can approve/reject any request regardless of manager", active: true },
          ].map((wf) => (
            <div key={wf.label} className={`flex items-center justify-between p-4 rounded-xl border ${wf.active ? "border-blue-200 bg-blue-50" : "border-gray-100 bg-gray-50"}`}>
              <div>
                <p className="text-sm font-semibold text-gray-900">{wf.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{wf.desc}</p>
              </div>
              <div className={`w-10 h-6 rounded-full flex items-center px-0.5 transition-colors ${wf.active ? "bg-blue-600 justify-end" : "bg-gray-300 justify-start"}`}>
                <div className="w-5 h-5 bg-white rounded-full shadow-sm" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={!!editingType} onClose={() => setEditingType(null)} title={`Edit: ${editingType?.name}`} size="lg"
        footer={
          <div className="flex gap-3">
            <button onClick={() => setEditingType(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
              <X className="w-4 h-4 inline mr-1" /> Cancel
            </button>
            <button onClick={handleSave} className="flex-1 py-2.5 bg-[#1E3A8A] text-white rounded-xl text-sm font-semibold hover:bg-blue-800 flex items-center justify-center gap-2">
              <Save className="w-4 h-4" /> Save Policy
            </button>
          </div>
        }>
        {editingType && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Leave Type Name" field="name" />
              <Field label="Code (e.g. CL)" field="code" />
            </div>
            <Field label="Description" field="description" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Accrual Type</label>
                <select value={formData.accrualType} onChange={(e) => setFormData((p: any) => ({ ...p, accrualType: e.target.value as "MONTHLY" | "YEARLY" }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 bg-white">
                  <option value="MONTHLY">Monthly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </div>
              <Field label="Accrual Rate (days)" field="accrualRate" type="number" min={0} max={365} step={0.5} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Carry Forward Limit (days)" field="carryForwardLimit" type="number" min={0} max={365} />
              <Field label="Max Consecutive Days" field="maxConsecutiveDays" type="number" min={1} max={365} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Color</label>
              <div className="flex items-center gap-3">
                <input type="color" value={formData.color} onChange={(e) => setFormData((p: any) => ({ ...p, color: e.target.value }))}
                  className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer" />
                <span className="text-sm text-gray-500">{formData.color}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Toggle label="Allow Negative Balance" field="allowNegativeBalance" desc="Employee can apply even with zero balance" />
              <Toggle label="Applicable During Probation" field="applicableDuringProbation" desc="Probation employees can use this leave" />
              <Toggle label="Requires Document" field="requiresDocument" desc="Employee must upload supporting document" />
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
