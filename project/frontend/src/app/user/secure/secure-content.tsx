"use client";
import { Button } from "@/components/ui/button";
import { IResponseLinkProvidersDto } from "@/modules/user/user.dto";
import { BsFillPeopleFill } from "react-icons/bs";
import { FaGoogle } from "react-icons/fa";
import { IoTrashBin } from "react-icons/io5";
import { MdAlternateEmail } from "react-icons/md";
import { MdChangeCircle } from "react-icons/md";
import { DataTable } from "./_components/table/data-table";
import { Separator } from "@/components/ui/separator";
import AddNewAuthForm from "./_components/forms/add-new-auth";
import { ChangePasswordForm } from "./_components/forms/change-password";
import { ChangeEmailForm } from "./_components/forms/change-email";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Toaster } from "@/components/shared/toast";
import { LoaderModule } from "@/components/shared/loader-module";
import { unlinkProviderAction } from "@/modules/auth/auth.actions";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

const renderIconProvider = (provider: string) => {
  switch (provider) {
    case "GOOGLE": {
      return <FaGoogle />;
    }
    case "USER": {
      return <BsFillPeopleFill />;
    }
  }
};

const ProviderRow = ({
  value,
  isPending,
  onUnlink,
}: {
  value: IResponseLinkProvidersDto;
  isPending: boolean;
  onUnlink: (accountId: string) => void;
}) => {
  return (
    <div className={"w-full flex flex-row justify-start items-center"}>
      <Button
        className={
          "w-3/5 flex flex-row rounded-r-none border border-primary/20 text-sm hover:shadow-md active:scale-[0.98] sm:text-base"
        }
      >
        {renderIconProvider(value.provider)}
        {value.provider}
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant={"destructive"}
            className={
              "rounded-l-none border border-destructive/20 hover:shadow-md active:scale-[0.98]"
            }
            disabled={isPending}
          >
            {isPending ? (
              <LoaderModule scale={0.4} className={"w-1 h-1"} />
            ) : (
              <IoTrashBin />
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Gỡ phương thức xác thực</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn gỡ {value.provider}? Nếu đây là phương thức đăng
              nhập duy nhất, hãy thêm phương thức khác trước khi gỡ.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              variant={"destructive"}
              onClick={() => onUnlink(value.id)}
            >
              Gỡ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const SecureContent = ({ data }: { data: IResponseLinkProvidersDto[] }) => {
  const router = useRouter();
  const [isUnlinking, startUnlinkTransition] = useTransition();
  const hasPassword = data.some((provider) => provider.provider === "USER");

  const handleUnlink = (accountId: string) => {
    startUnlinkTransition(async () => {
      const res = await unlinkProviderAction({ accountId });

      if (res && "success" in res && res.success === false) {
        Toaster({
          title: "Gỡ phương thức thất bại",
          description: res.message,
          type: "error",
          cancel: {
            label: "OK",
            onClick: () => {},
          },
        });
      } else {
        Toaster({
          title: "Gỡ phương thức thành công",
          description: res?.message,
          type: "success",
          cancel: {
            label: "OK",
            onClick: () => {},
          },
        });
        router.refresh();
      }
    });
  };

  return (
    <div
      className={
        "w-full h-full flex flex-col justify-center items-center gap-3 p-5 md:p-5 lg:px-20 lg:py-10"
      }
    >
      {/* display link auth providers first */}
      <section
        className={"w-full flex flex-col justify-start items-start gap-3 my-5"}
      >
        <h3 className={"font-bold text-lg"}>Phương thức xác thực</h3>
        <div
          className={
            " w-full grid grid-cols-1 md:grid-cols-2 justify-stretch gap-3"
          }
        >
          {data.map((value) => (
            <ProviderRow
              key={value.id}
              value={value}
              isPending={isUnlinking}
              onUnlink={handleUnlink}
            />
          ))}
          <AddNewAuthForm data={data} />
        </div>
        <Separator />
      </section>
      {/* display history auth log */}
      <section
        className={
          "w-full flex flex-col justify-center items-center gap-3 my-5"
        }
      >
        <h3 className={"font-bold text-center text-lg"}>Lịch sử đăng nhập</h3>
        <DataTable />
      </section>
      <Separator />

      {/* display change password, delete account */}
      <section
        className={
          "w-full flex flex-col justify-center items-center gap-3 my-5"
        }
      >
        <h3 className={"font-bold text-center text-lg"}>Tùy chọn bảo mật</h3>
        <div
          className={
            "w-full flex flex-col md:grid md:grid-cols-2 md:grid-rows-1 gap-3 justify-center items-center"
          }
        >
          <Dialog>
            <DialogTrigger asChild>
              <Button
                className={
                  "w-4/5 flex flex-row justify-self-center border border-primary/20 text-sm hover:shadow-md active:scale-[0.98] sm:text-base"
                }
              >
                <MdChangeCircle />
                Đổi mật khẩu
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>Đổi mật khẩu</DialogTitle>
              <DialogDescription>
                Nhập mật khẩu hiện tại và mật khẩu mới của bạn.
              </DialogDescription>
              <ChangePasswordForm />
            </DialogContent>
          </Dialog>
          {hasPassword && (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  className={
                    "w-4/5 flex flex-row justify-self-center border border-primary/20 text-sm hover:shadow-md active:scale-[0.98] sm:text-base"
                  }
                >
                  <MdAlternateEmail />
                  Đổi email
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>Đổi email</DialogTitle>
                <DialogDescription>
                  Email dùng để đăng nhập bằng mật khẩu sẽ được cập nhật.
                </DialogDescription>
                <ChangeEmailForm />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </section>
    </div>
  );
};
export default SecureContent;
