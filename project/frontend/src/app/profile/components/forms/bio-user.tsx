import { FieldGroup } from "@/components/ui/field";
import { Dispatch, JSX, SetStateAction } from "react";

interface BioProps {
  bio: string;
  setBio: Dispatch<SetStateAction<Record<string, string>>>;
}

const listBio = [];

const BioUserGroup = ({ bio, setBio }: BioProps): JSX.Element => {
  const handleUpdateBio = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBio((prevBio) => ({ ...prevBio, [name]: value }));
  };
  return <FieldGroup></FieldGroup>;
};
export default BioUserGroup;
