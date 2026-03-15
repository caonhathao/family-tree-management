"use client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { IoFilterOutline } from "react-icons/io5";
import { RiResetRightLine } from "react-icons/ri";
import { z } from "zod";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface SearchProps {
  placeholder: string;

  keyQueryList: string[];
}

const formSchema = z.object({
  keyword: z.string().min(1, "Không có từ khóa"),
});

const SearchBar = ({ placeholder, keyQueryList }: SearchProps) => {
  const [keyQuery, setKeyQuery] = useState<string>(keyQueryList[0]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const onSubmit = (value: z.infer<typeof formSchema>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("filterType", keyQuery);
    params.set("filter", value.keyword);
    params.set("page", "1");
    params.set("limit", "10");

    router.push(`${pathname}?${params.toString()}`);
  };
  const resetResult = () => {
    form.reset();

    const params = new URLSearchParams(searchParams.toString());

    params.set("page", "1");
    params.set("limit", "10");
    params.delete("filterType");
    params.delete("filter");

    router.push(`${pathname}?${params.toString()}`);
  };

  //define form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      keyword: "",
    },
  });

  //console.log(keyQuery);

  return (
    <div
      className={"w-full flex flex-row justify-center items-center gap-3 mb-5"}
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className={"w-[50%]"}>
        <Controller
          control={form.control}
          name={"keyword"}
          render={({ field }) => (
            <Field>
              <InputGroup>
                <InputGroupInput placeholder={placeholder} {...field} />
                <InputGroupAddon align={"inline-end"}>
                  <InputGroupButton
                    variant={"outline"}
                    onClick={() => resetResult()}
                    className={"hover:cursor-pointer"}
                  >
                    <RiResetRightLine />
                  </InputGroupButton>
                  <InputGroupButton
                    variant={"secondary"}
                    type={"submit"}
                    className={"hover:cursor-pointer"}
                  >
                    Tìm kiếm
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </Field>
          )}
        />
      </form>
      <div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant={"outline"} className={"hover:cursor-pointer"}>
              <IoFilterOutline />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className={"w-56"} align={"start"}>
            <DropdownMenuLabel>Lọc theo</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={keyQuery}
              onValueChange={setKeyQuery}
            >
              {keyQueryList.map((value, key) => (
                <DropdownMenuRadioItem
                  key={key}
                  value={value}
                  className={"hover:cursor-pointer"}
                >
                  {value}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default SearchBar;
