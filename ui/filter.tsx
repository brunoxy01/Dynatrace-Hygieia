import React from "react";
import { Select } from "@dynatrace/strato-components/forms";
export function Filter({
  label,
  values,
  value,
  change,
}: {
  label: string;
  values: string[];
  value: string;
  change: (v: string) => void;
}) {
  return (
    <div className="filter-control">
      <span>{label}</span>
      <Select
        aria-label={label}
        value={value || "__all__"}
        onChange={(v) => change(v === "__all__" ? "" : String(v ?? ""))}
      >
        <Select.Trigger />
        <Select.Content>
          <Select.Filter />
          <Select.Option value="__all__">Todos</Select.Option>
          {values.map((v) => (
            <Select.Option key={v} value={v}>
              {v}
            </Select.Option>
          ))}
        </Select.Content>
      </Select>
    </div>
  );
}
