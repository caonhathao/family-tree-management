import { Button } from "@/components/ui/button";

const Footer = () => {
  return (
    <div className="w-full h-fit px-2 py-1 flex flex-row justify-between items-center bg-gray-200 text-xs font-semibold">
      <div>Established 2026 - 2026</div>
      <div>
        Copyright by:
        <Button variant={"link"} className="hover:cursor-pointer">
          caonhathao2372004@gmail.com
        </Button>
      </div>
    </div>
  );
};
export default Footer;
