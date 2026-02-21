import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RiPencilFill } from "react-icons/ri";

const FeaturesPage = () => {
  return (
    <div className={"relative"}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={"outline"}
            size={"icon"}
            className={"fixed right-2 top-20 hover:cursor-pointer"}
          >
            <RiPencilFill />
          </Button>
        </TooltipTrigger>
        <TooltipContent side={"left"}>
          <p>Sửa bài viết</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
export default FeaturesPage;
