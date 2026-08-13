"use client";
import { Button } from "@/components/ui/button";
import { IResponseLinkProvidersDto } from "@/modules/user/user.dto";
import { BsFillPeopleFill } from "react-icons/bs";
import { FaGoogle } from "react-icons/fa";
import { IoTrashBin } from "react-icons/io5";
import { MdAlternateEmail, MdOutlinePassword } from "react-icons/md";
import { DataTable } from "./_components/table/data-table";
import AddNewAuthForm from "./_components/forms/add-new-auth";
import { ChangePasswordForm } from "./_components/forms/change-password";
import { ChangeEmailForm } from "./_components/forms/change-email";
import ViewLoginInfo from "./_components/forms/view-login-info";
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
import {
  unlinkProviderAction,
  deleteAccountAction,
} from "@/modules/auth/auth.actions";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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
    <div className={"w-full h-10 flex flex-row justify-start items-stretch"}>
      <Button
        className={
          "flex-1 flex flex-row rounded-r-none border border-primary/20 text-sm hover:shadow-md active:scale-[0.98] sm:text-base h-full"
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
              "h-full rounded-l-none border border-destructive/20 hover:shadow-md active:scale-[0.98]"
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

  const [isDeleting, startDeleteTransition] = useTransition();
  const [deletePassword, setDeletePassword] = useState("");

  const handleDeleteAccount = () => {
    startDeleteTransition(async () => {
      const res = await deleteAccountAction({
        ...(hasPassword ? { password: deletePassword } : {}),
      });

      if (res && "message" in res) {
        Toaster({
          title: "Xóa tài khoản thất bại",
          description: res.message as string,
          type: "error",
          cancel: {
            label: "OK",
            onClick: () => {},
          },
        });
      } else {
        Toaster({
          title: "Đã xóa tài khoản",
          description: "Tài khoản và toàn bộ dữ liệu đã được xóa vĩnh viễn",
          type: "success",
          cancel: {
            label: "OK",
            onClick: () => {},
          },
        });
        window.location.href = "/auth?mode=login";
      }
    });
  };

  return (
    <div
      className={cn(
        "w-full h-full flex flex-col justify-center items-center gap-3 p-5 md:p-5 lg:px-20 lg:py-10",
        "lg:flex-row",
      )}
    >
      {/* display link auth providers first */}
      <section
        className={cn(
          "w-full flex flex-col justify-center items-start gap-3",
          "lg:w-[40%]",
        )}
      >
        <div
          className={
            "w-full flex flex-col justify-start items-center gap-3 my-5"
          }
        >
          <h3 className={"font-bold text-lg"}>Phương thức xác thực</h3>
          <div
            className={cn(
              "w-full grid grid-cols-2 justify-stretch items-stretch gap-3",
            )}
          >
            {data.map((value) => (
              <div key={value.id} className={"w-full"}>
                <ProviderRow
                  value={value}
                  isPending={isUnlinking}
                  onUnlink={handleUnlink}
                />
              </div>
            ))}
            <div className={"w-full h-10"}>
              <AddNewAuthForm data={data} />
            </div>
          </div>
        </div>
        {/* display change password, delete account */}
        <div
          className={
            "w-full flex flex-col justify-center items-center gap-3 my-5"
          }
        >
          <h3 className={"font-bold text-center text-lg"}>Tùy chọn bảo mật</h3>
          <div
            className={
              "w-full grid grid-cols-2 gap-3 justify-center items-center"
            }
          >
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  className={cn(
                    "w-full h-10 flex flex-row justify-self-center border border-primary/20 text-sm hover:shadow-md active:scale-[0.98] sm:text-base",
                  )}
                >
                  <MdOutlinePassword />
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
                    className={cn(
                      "w-full h-10 flex flex-row justify-self-center border border-primary/20 text-sm hover:shadow-md active:scale-[0.98] sm:text-base",
                    )}
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
            <ViewLoginInfo providers={data} />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant={"destructive"}
                  className={cn(
                    "w-full h-10 flex flex-row justify-self-center border border-destructive/20 text-sm hover:shadow-md active:scale-[0.98] sm:text-base",
                  )}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <LoaderModule scale={0.4} className={"w-1 h-1"} />
                  ) : (
                    <IoTrashBin />
                  )}
                  Xóa tài khoản
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xóa tài khoản</AlertDialogTitle>
                  <AlertDialogDescription>
                    Hành động này không thể hoàn tác. Toàn bộ dữ liệu của bạn
                    trong database (các nhóm đã tham gia, lịch sử đăng nhập,
                    phiên đăng nhập, ...) sẽ bị xóa vĩnh viễn, đồng thời toàn bộ
                    media cá nhân đã upload (avatar, ...) cũng sẽ bị xóa khỏi bộ
                    lưu trữ Cloudinary.
                    {hasPassword && (
                      <span className={"block my-2"}>
                        Nhập mật khẩu hiện tại để xác nhận:
                      </span>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                {hasPassword && (
                  <div className={"px-6 pb-2"}>
                    <Input
                      type={"password"}
                      placeholder={"Mật khẩu của bạn"}
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      disabled={isDeleting}
                    />
                  </div>
                )}
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction
                    variant={"destructive"}
                    onClick={handleDeleteAccount}
                  >
                    Xóa tài khoản
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </section>
      {/* display history auth log */}
      <section
        className={cn(
          "w-full flex flex-col justify-center items-center gap-3 my-5",
          "lg:max-w-[60%]",
        )}
      >
        <h3 className={"font-bold text-center text-lg"}>Lịch sử đăng nhập</h3>
        <DataTable />
      </section>
    </div>
  );
};
export default SecureContent;
