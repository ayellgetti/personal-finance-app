import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, NativeSelect } from "@/components/modules/shared";
import type { ReminderFormState } from "@/lib/crm/reminder";

export function ReminderFields({
  form,
  errors,
  contacts,
  showContact,
  onChange,
}: {
  form: ReminderFormState;
  errors: Record<string, string>;
  contacts: { id: string; name: string }[];
  showContact: boolean;
  onChange: (next: ReminderFormState) => void;
}) {
  return (
    <>
      <Field id="reminder-title" label="Title" error={errors.title}>
        <Input
          id="reminder-title"
          value={form.title}
          onChange={(event) => onChange({ ...form, title: event.target.value })}
          className="rounded-xl"
        />
      </Field>
      <Field id="reminder-description" label="Description">
        <Textarea
          id="reminder-description"
          rows={4}
          value={form.description}
          onChange={(event) => onChange({ ...form, description: event.target.value })}
          placeholder="What should you remember?"
          className="rounded-xl"
        />
      </Field>
      <Field id="reminder-at" label="Remind at" error={errors.remindAt}>
        <Input
          id="reminder-at"
          type="datetime-local"
          value={form.remindAt}
          onChange={(event) => onChange({ ...form, remindAt: event.target.value })}
          className="rounded-xl"
        />
      </Field>
      {showContact ? (
        <Field id="reminder-contact" label="Contact">
          <NativeSelect
            id="reminder-contact"
            value={form.contactId}
            onChange={(value) => onChange({ ...form, contactId: value })}
          >
            <option value="">No contact</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
      ) : null}
    </>
  );
}
