import {
  FAMILY_GENDERS,
  FAMILY_RELATIONSHIPS,
  FamilyGender,
  FamilyMemberDraft,
  FamilyRelationship,
} from "@/types/finance";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { familyMemberError, type FieldErrors } from "@/lib/finance/setup-validation";

const GENDER_LABEL: Record<FamilyGender, string> = {
  female: "Female",
  male: "Male",
  other: "Other",
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-danger">{message}</p>;
}

export function FamilyMemberFields({
  members,
  errors,
  onChange,
}: {
  members: FamilyMemberDraft[];
  errors: FieldErrors;
  onChange: (index: number, patch: Partial<FamilyMemberDraft>) => void;
}) {
  if (members.length === 0) return null;

  return (
    <div className="col-span-2 space-y-4">
      <p className="text-sm font-medium">Family member details</p>
      {members.map((member, index) => (
        <div key={index} className="grid grid-cols-2 gap-4 rounded-xl border border-border p-4">
          <p className="col-span-2 text-sm font-semibold">Dependent {index + 1}</p>
          <div className="space-y-2">
            <Label htmlFor={`family-${index}-name`} className={familyMemberError(errors, index, "name") ? "text-danger" : undefined}>Name</Label>
            <Input
              id={`family-${index}-name`}
              value={member.name}
              onChange={(event) => onChange(index, { name: event.target.value })}
              aria-invalid={Boolean(familyMemberError(errors, index, "name"))}
            />
            <FieldError message={familyMemberError(errors, index, "name")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`family-${index}-relationship`} className={familyMemberError(errors, index, "relationship") ? "text-danger" : undefined}>Relationship</Label>
            <Select
              value={member.relationship || undefined}
              onValueChange={(value) => onChange(index, { relationship: value as FamilyRelationship })}
            >
              <SelectTrigger id={`family-${index}-relationship`} aria-invalid={Boolean(familyMemberError(errors, index, "relationship"))}>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {FAMILY_RELATIONSHIPS.map((option) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={familyMemberError(errors, index, "relationship")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`family-${index}-dob`} className={familyMemberError(errors, index, "dob") ? "text-danger" : undefined}>Date of birth</Label>
            <Input
              id={`family-${index}-dob`}
              type="date"
              value={member.dob}
              onChange={(event) => onChange(index, { dob: event.target.value })}
              aria-invalid={Boolean(familyMemberError(errors, index, "dob"))}
            />
            <FieldError message={familyMemberError(errors, index, "dob")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`family-${index}-gender`} className={familyMemberError(errors, index, "gender") ? "text-danger" : undefined}>Gender</Label>
            <Select
              value={member.gender || undefined}
              onValueChange={(value) => onChange(index, { gender: value as FamilyGender })}
            >
              <SelectTrigger id={`family-${index}-gender`} aria-invalid={Boolean(familyMemberError(errors, index, "gender"))}>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {FAMILY_GENDERS.map((option) => (
                  <SelectItem key={option} value={option}>{GENDER_LABEL[option]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={familyMemberError(errors, index, "gender")} />
          </div>
          <div className="col-span-2 space-y-2">
            <Label htmlFor={`family-${index}-occupation`} className={familyMemberError(errors, index, "occupation") ? "text-danger" : undefined}>Occupation</Label>
            <Input
              id={`family-${index}-occupation`}
              value={member.occupation}
              onChange={(event) => onChange(index, { occupation: event.target.value })}
              aria-invalid={Boolean(familyMemberError(errors, index, "occupation"))}
            />
            <FieldError message={familyMemberError(errors, index, "occupation")} />
          </div>
        </div>
      ))}
    </div>
  );
}
