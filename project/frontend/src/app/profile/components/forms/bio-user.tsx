"use client";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { safeJsonParse } from "@/lib/util/utils.lib";
import { Dispatch, JSX, SetStateAction, useEffect, useState } from "react";
import { IoIosClose } from "react-icons/io";

interface IBioProps {
  bio: Record<string, string>[];
  setBio: Dispatch<SetStateAction<Record<string, string>[]>>;
}

interface IListBio {
  title: string;
  key: string;
  placeholder: string;
}

//define keys
const listBio: IListBio[] = [
  {
    title: "Phim và sách",
    key: "movies_books",
    placeholder: "Bạn thích phim/sách gì?",
  },
  {
    title: "Trình độ học vấn",
    key: "educational_level",
    placeholder: "Học vấn cao nhất bạn đã đạt được?",
  },
  {
    title: "Thể thao",
    key: "sports",
    placeholder: "Bạn thích chơi thể thao gì?",
  },
  {
    title: "Công việc",
    key: "works",
    placeholder: "Bạn đang làm việc tại đâu?",
  },
  {
    title: "Sở thích",
    key: "interests",
    placeholder: "Bạn thích làm gì?",
  },
  {
    title: "Đia điểm yêu thích",
    key: "location",
    placeholder: "Bạn thích ở đâu?",
  },
  { title: "Khác", key: "others", placeholder: "Bạn thích gì?" },
];

const BioUserGroup = ({ bio, setBio }: IBioProps) => {
  const [data, setData] = useState<Record<string, string>[]>(bio || []);

  const handleUpdateValue = (key: string, newValue: string) => {
    const newData = data.map((item) =>
      item.key === key ? { ...item, value: newValue } : item,
    );
    setData(newData);
    setBio(newData);
  };

  const addNewField = (key: string) => {
    if (data.find((item) => item.key === key)) return;
    setData([...data, { key, value: "" }]);
  };

  const removeField = (key: string) => {
    const newData = data.filter((item) => item.key !== key);

    setData(newData);

    setBio(newData);
  };

  useEffect(() => {
    console.log(bio);
  }, [bio, data]);
  if (!data) return null;

  return (
    <FieldGroup className={"flex flex-col gap-1"}>
      <FieldLabel>Đôi điều về bạn:</FieldLabel>
      <div className={"flex flex-col h-fit gap-1"}>
        {data.map((item) => {
          const payload = listBio.find((i) => i.key === item.key);
          if (!payload) return null;

          return (
            <Field key={item.key} className={"border rounded-lg p-2"}>
              <FieldLabel htmlFor={item.key}>{payload.title}</FieldLabel>
              <div className={"flex flex-row gap-1"}>
                <Input
                  placeholder={payload.placeholder}
                  value={item.value}
                  required
                  onChange={(e) => handleUpdateValue(item.key, e.target.value)}
                />
                <Button
                  type={"button"}
                  variant={"destructive"}
                  size={"icon"}
                  className={"hover:cursor-pointer"}
                  onClick={() => removeField(item.key)}
                >
                  <IoIosClose />
                </Button>
              </div>
            </Field>
          );
        })}
      </div>

      <Select onValueChange={(val) => addNewField(val)}>
        <SelectTrigger className={"hover:cursor-pointer"}>
          <SelectValue placeholder={"Thêm chủ đề..."} />
        </SelectTrigger>
        <SelectContent>
          {listBio.map((item) => (
            <SelectItem
              key={item.key}
              value={item.key}
              className={"hover:cursor-pointer"}
              disabled={data.find((i) => i.key === item.key) ? true : false}
            >
              {item.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldGroup>
  );
};
export default BioUserGroup;
