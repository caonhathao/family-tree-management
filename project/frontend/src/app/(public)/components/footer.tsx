import { Button } from "@/components/ui/button";

const Footer = () => {
  return (
    <div
      className={
        "w-full h-fit px-2 py-1 flex flex-col justify-start items-start text-xs font-semibold text-muted-foreground"
      }
    >
      <p>@Copyright MYFA Project 2026</p>
      <div>
        Contact:
        <Button variant={"link"} className={"hover:cursor-pointer"}>
          caonhathao2372004@gmail.com
        </Button>
      </div>
    </div>
  );
};
export default Footer;
