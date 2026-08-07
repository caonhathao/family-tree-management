import { Button } from "@/components/ui/button";

const Footer = () => {
  return (
    <div
      className={
        "w-full lg:w-4/5 lg:mx-auto h-fit bg-footer border p-5 flex flex-col justify-start items-start text-xs font-semibold text-muted-foreground"
      }
    >
      <p>@Copyright MYFA Project 2026</p>
      <div>
        Contact:
        <Button
          variant={"link"}
          className={"hover:cursor-pointer text-sm sm:text-base"}
        >
          caonhathao2372004@gmail.com
        </Button>
      </div>
    </div>
  );
};
export default Footer;
