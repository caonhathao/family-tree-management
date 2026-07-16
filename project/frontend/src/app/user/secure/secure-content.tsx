"use client";
import { Button } from "@/components/ui/button";
import { IResponseLinkProvidersDto } from "@/modules/user/user.dto";
import { BsFillPeopleFill } from "react-icons/bs";
import { FaGoogle } from "react-icons/fa";
import { IoTrashBin } from "react-icons/io5";
import { MdChangeCircle } from "react-icons/md";
import { DataTable } from "./_components/table/data-table";
import { Separator } from "@/components/ui/separator";
import AddNewAuthForm from "./_components/forms/add-new-auth";

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

const SecureContent = ({ data }: { data: IResponseLinkProvidersDto[] }) => {
  console.log(data);
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
            <div
              key={value.id}
              className={"w-full flex flex-row justify-start items-center"}
            >
              <Button className={"w-3/5 flex flex-row rounded-r-none"}>
                {renderIconProvider(value.provider)}
                {value.provider}
              </Button>
              <Button
                variant={"destructive"}
                className={"rounded-l-none"}
                onClick={() => alert("Tính năng đang phát triển")}
              >
                <IoTrashBin />
              </Button>
            </div>
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
          <Button className={"w-4/5 flex flex-row justify-self-center"}>
            <MdChangeCircle />
            Đổi mật khẩu
          </Button>
          <Button
            variant={"destructive"}
            className={"w-4/5 flex flex-row justify-self-center"}
          >
            <IoTrashBin />
            Xóa tài khoản
          </Button>
        </div>
      </section>
    </div>
  );
};
export default SecureContent;
