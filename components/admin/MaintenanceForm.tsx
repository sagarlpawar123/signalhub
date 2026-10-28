"use client";

import { useState } from "react";
import { Boxes } from "lucide-react";
import { PlatformActionForm } from "@/components/platform/PlatformActionForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckRow } from "@/components/admin/operate-ui";
import { utcToZonedDateTime } from "@/lib/page-locale";
import { cn } from "@/lib/utils";
import { INPUT_LIMITS } from "@/lib/input-limits";

type Component = { id: string; name: string };

function defaultDateTime(offsetHours: number, timeZone: string) {
  const hour = 3600 * 1000;
  return utcToZonedDateTime(Math.floor((Date.now() + offsetHours * hour) / hour) * hour, timeZone);
}

export function MaintenanceForm({
  action,
  pageId,
  components,
  timeZone,
}: {
  action: (formData: FormData) => void;
  pageId: string;
  components: Component[];
  timeZone: string;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [notify, setNotify] = useState(true);
  const [sendReminder, setSendReminder] = useState(true);

  return (
    <PlatformActionForm action={action} successMessage="Maintenance scheduled" className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]" messageClassName="empty:hidden lg:col-span-2">
      <Input type="hidden" name="pageId" value={pageId} />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>Subscribers and visitors read this announcement.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Title" htmlFor="maintenance-name" required>
              <Input id="maintenance-name" name="name" maxLength={INPUT_LIMITS.title} value={name} onChange={(event) => setName(event.target.value)} required />
            </Field>
            <Field label="Message" htmlFor="maintenance-body" hint="What is changing, what to expect, and who is affected." required>
              <Textarea id="maintenance-body" name="body" maxLength={INPUT_LIMITS.body} value={body} onChange={(event) => setBody(event.target.value)} rows={4} required />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
            <CardDescription>Set when the window starts and ends. Times are in the page time zone ({timeZone}).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Start" htmlFor="maintenance-start" required>
                <Input id="maintenance-start" name="scheduledStart" type="datetime-local" defaultValue={defaultDateTime(24, timeZone)} required />
              </Field>
              <Field label="End" htmlFor="maintenance-end" required>
                <Input id="maintenance-end" name="scheduledEnd" type="datetime-local" defaultValue={defaultDateTime(27, timeZone)} required />
              </Field>
            </div>
            <CheckRow name="autoTransition" defaultChecked label="Automatically start/complete based on the window above" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Affected components</CardTitle>
            <CardDescription>Selected components are set to Under Maintenance during the window.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <CheckRow name="pageWide" label="This maintenance affects the page as a whole" />
            {components.length === 0 ? (
              <EmptyState icon={Boxes} hue="sky" title="No components on this page yet" description="Add components to the page to mark them as affected." className="py-8" />
            ) : (
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {components.map((c) => {
                  const checked = selected.includes(c.id);
                  return (
                    <label key={c.id} className={cn("flex cursor-pointer items-center gap-3 rounded-control border px-3.5 py-3 text-sm transition-colors duration-200", checked ? "border-primary/40 bg-primary-soft/50" : "border-line hover:bg-sunken")}>
                      <Checkbox
                        name="componentIds"
                        value={c.id}
                        checked={checked}
                        onChange={(e) => setSelected(e.target.checked ? [...selected, c.id] : selected.filter((id) => id !== c.id))}
                      />
                      <span className="min-w-0 truncate font-medium text-ink">{c.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Choose when subscribers hear about this window.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <CheckRow
              name="notify"
              checked={notify}
              onChange={(event) => setNotify(event.target.checked)}
              label="Notify subscribers"
              hint="When the window is scheduled and during automatic status transitions."
            />
            <div className="space-y-3 rounded-control bg-sunken/50 p-3.5">
              <CheckRow
                name="sendReminder"
                checked={notify && sendReminder}
                disabled={!notify}
                onChange={(event) => setSendReminder(event.target.checked)}
                label="Send one reminder before maintenance starts"
                hint={notify ? undefined : "Reminders are only sent when subscribers are notified."}
                className="border-0 bg-transparent p-0 hover:bg-transparent"
              />
              <Field label="Minutes before start" htmlFor="maintenance-reminder" hint="5 minutes to 7 days">
                <Input
                  id="maintenance-reminder"
                  name="reminderMinutesBefore"
                  type="number"
                  min={5}
                  max={7 * 24 * 60}
                  defaultValue={60}
                  disabled={!notify || !sendReminder}
                  required={notify && sendReminder}
                />
              </Field>
            </div>
          </CardContent>
        </Card>
        <Button type="submit" size="lg" className="w-full">Schedule maintenance</Button>
      </div>
    </PlatformActionForm>
  );
}
