"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { IFamilyMemberDto } from "@/modules/family-member/family-member.dto";

export function MemberSelect({
  members,
  value,
  onChange,
  placeholder,
}: {
  members: IFamilyMemberDto[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          role={"combobox"}
          aria-expanded={open}
          className={"w-full justify-between font-normal hover:cursor-pointer"}
        >
          {value
            ? members.find((m: IFamilyMemberDto) => m.localId === value)
                ?.fullName
            : placeholder}
          <ChevronsUpDown className={"ml-2 h-4 w-4 shrink-0 opacity-50"} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={"w-(--radix-popover-trigger-width) p-0"}>
        <Command>
          <CommandInput placeholder={"Tìm tên thành viên..."} />
          <CommandList>
            <CommandEmpty>Không tìm thấy thành viên.</CommandEmpty>
            <CommandGroup>
              {members.map((member: IFamilyMemberDto) => (
                <CommandItem
                  key={member.localId}
                  value={member.fullName} // Command sẽ lọc theo value này
                  onSelect={() => {
                    onChange(member.localId);
                    setOpen(false);
                  }}
                  className={"hover:cursor-pointer"}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === member.localId ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {member.fullName}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
