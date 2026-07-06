import { Toaster } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { updateGroupFamilyAction } from "@/modules/group-family/group-family.actions";
import { UpdateGroupFamilySchema } from "@/modules/group-family/group-family.client-schemas";
import {
  IResponseGroupFamiliesDto,
  IResponseGroupFamilyDetailDto,
  IUpdateGroupFamilyDto,
} from "@/modules/group-family/group-family.dto";
import { zodResolver } from "@hookform/resolvers/zod";
import isEqual from "lodash.isequal";
import { Dispatch, SetStateAction } from "react";
import { useForm, Controller } from "react-hook-form";
import { TbEdit } from "react-icons/tb";

interface IFamilyInfoProps {
  data: IResponseGroupFamilyDetailDto;
  setIsUpdate: Dispatch<SetStateAction<boolean>>;
}

const FamilyInfoForm = ({ data, setIsUpdate }: IFamilyInfoProps) => {
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<IUpdateGroupFamilyDto>({
    resolver: zodResolver(UpdateGroupFamilySchema),
    defaultValues: {
      name: data.name || "",
      description: data.description || "",
    },
  });

  const onSubmit = async (
    values: IUpdateGroupFamilyDto,
    e?: React.BaseSyntheticEvent,
  ) => {
    e?.preventDefault();
    const origin = { name: data.name, description: data.description };

    if (isEqual(origin, values)) {
      Toaster({
        title: "Thông báo",
        description: "Không có thay đổi nào diễn ra",
        type: "info",
      });
    }
    const res = await updateGroupFamilyAction(data.id, values);
    // console.log(res);
    if (res && "error" in res) {
      Toaster({
        title: "Lỗi",
        description: res.error,
        type: "error",
      });
    } else {
      Toaster({
        title: "Thành công",
        description: "Cập nhật thành công",
        type: "success",
      });
    }
  };
  return (
    <Card className={"absolute top-0 right-0 z-9999 w-full"}>
      <CardHeader>
        <CardTitle className={"lg:text-xl"}>Cập nhật thông tin</CardTitle>
        <CardDescription className={"lg:text-lg"}>
          Vui lòng điền thông tin vào các ô sau
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id={"update-family-info-form"}
          onSubmit={handleSubmit(onSubmit)}
          className={"flex flex-row justify-between items-center w-full gap-2"}
        >
          <div className={"w-full flex flex-col gap-2"}>
            <Controller
              name={"name"}
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name} className={"lg:text-lg"}>
                    Tên nhóm
                  </FieldLabel>
                  <Input
                    {...field}
                    className={
                      "text-lg font-semibold bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-ring rounded px-1 -ml-1 w-full"
                    }
                    placeholder={"Nhập tên nhóm..."}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name={"description"}
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name} className={"lg:text-lg"}>
                    Mô tả
                  </FieldLabel>
                  <Input
                    {...field}
                    className={
                      "text-sm text-muted-foreground bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-ring rounded px-1 -ml-1 w-full resize-none"
                    }
                    placeholder={"Thêm mô tả ngắn gọn..."}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>
        </form>
      </CardContent>
      <CardFooter className={"w-full flex justify-center items-center gap-3"}>
        <Button
          formTarget={"update-family-info-form"}
          type={"button"}
          variant={"outline"}
          className={"hover:cursor-pointer"}
          onClick={() => setIsUpdate(false)}
        >
          Hủy bỏ
        </Button>
        <Button
          formTarget={"update-family-info-form"}
          type={"submit"}
          variant={"outline"}
          className={"hover:cursor-pointer bg-primary text-white"}
        >
          Cập nhật
        </Button>
      </CardFooter>
    </Card>
  );
};
export default FamilyInfoForm;
