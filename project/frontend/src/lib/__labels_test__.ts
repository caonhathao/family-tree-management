import { computeLabels } from "./utils";
import { IDraftFamilyData } from "@/types/draft.types";

const G = (id: string, gen: number, gender: string, name: string) => ({
  localId: id,
  fullName: name,
  gender,
  generation: gen,
  dateOfBirth: undefined,
  isAlive: true,
});

const rel = (from: string, to: string, type: string) => ({
  localId: `r_${from}_${to}_${type}`,
  fromMemberId: from,
  toMemberId: to,
  type,
});

function run(name: string, draft: IDraftFamilyData, pinnedId: string) {
  const labels = computeLabels(pinnedId, draft);
  console.log(`\n=== ${name} === (pinned=${pinnedId})`);
  const sorted = [...labels.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const names = new Map(draft.members.map((m) => [m.localId, m.fullName]));
  for (const [id, label] of sorted) {
    console.log(`  ${names.get(id)}: ${label}`);
  }
}

// ---- Scenario 1: real working data (3 generations) ----
const s1: IDraftFamilyData = {
  family: { localId: "fam", name: "t", lineageType: "PATRIARCHAL", description: undefined },
  members: [
    G("huá»‡", 0, "MALE", "huá»‡(Ã´ng)"),
    G("trÆ°Æ¡ng", 0, "FEMALE", "trÆ°Æ¡ng(bÃ )"),
    G("hÃ²a", 1, "MALE", "hÃ²a(cha)"),
    G("hoa", 1, "FEMALE", "hoa(máº¹)"),
    G("hÃ o", 2, "MALE", "hÃ o(me)"),
  ],
  relationships: [
    rel("huá»‡", "hÃ²a", "PARENT"),
    rel("hÃ²a", "hÃ o", "PARENT"),
    rel("huá»‡", "trÆ°Æ¡ng", "SPOUSE"),
    rel("hÃ²a", "hoa", "SPOUSE"),
  ],
};
run("S1 real working data", s1, "hÃ o");

// ---- Scenario 2: add a paternal uncle (chÃº, younger brother of father) + thÃ­m ----
const s2: IDraftFamilyData = {
  family: { localId: "fam", name: "t", lineageType: "PATRIARCHAL", description: undefined },
  members: [
    G("Ã´ng0", 0, "MALE", "Ã”ng"),
    G("bÃ 0", 0, "FEMALE", "BÃ "),
    G("cha", 1, "MALE", "Cha(gen1)"),
    G("me", 1, "FEMALE", "Máº¹(gen1)"),
    G("chÃº", 1, "MALE", "ChÃº(em cha)"),
    G("thÃ­m", 1, "FEMALE", "ThÃ­m(vá»£ chÃº)"),
    G("tÃ´i", 2, "MALE", "TÃ´i(gen2)"),
  ],
  relationships: [
    rel("Ã´ng0", "cha", "PARENT"),
    rel("Ã´ng0", "chÃº", "PARENT"),
    rel("Ã´ng0", "bÃ 0", "SPOUSE"),
    rel("cha", "me", "SPOUSE"),
    rel("chÃº", "thÃ­m", "SPOUSE"),
    rel("cha", "tÃ´i", "PARENT"),
  ],
};
run("S2 paternal uncle (chÃº/thÃ­m)", s2, "tÃ´i");

// ---- Scenario 3: maternal uncle (cáº­u) + dÃ¬ ----
const s3: IDraftFamilyData = {
  family: { localId: "fam", name: "t", lineageType: "PATRIARCHAL", description: undefined },
  members: [
    G("Ã´ng0", 0, "MALE", "Ã”ngNgoáº¡i"),
    G("bÃ 0", 0, "FEMALE", "BÃ Ngoáº¡i"),
    G("cha", 1, "MALE", "Cha(gen1)"),
    G("me", 1, "FEMALE", "Máº¹(gen1)"),
    G("cáº­u", 1, "MALE", "Cáº­u(em máº¹)"),
    G("dÃ¬", 1, "FEMALE", "DÃ¬(em máº¹)"),
    G("tÃ´i", 2, "MALE", "TÃ´i(gen2)"),
  ],
  relationships: [
    rel("Ã´ng0", "me", "PARENT"),
    rel("Ã´ng0", "cáº­u", "PARENT"),
    rel("Ã´ng0", "dÃ¬", "PARENT"),
    rel("Ã´ng0", "bÃ 0", "SPOUSE"),
    rel("cha", "me", "SPOUSE"),
    rel("cha", "tÃ´i", "PARENT"),
  ],
};
run("S3 maternal uncle (máº¹ ná»‘i hÃ¬nh cha) + cáº­u/dÃ¬", s3, "tÃ´i");

// ---- Scenario 4: children + grandchildren ----
const s4: IDraftFamilyData = {
  family: { localId: "fam", name: "t", lineageType: "PATRIARCHAL", description: undefined },
  members: [
    G("cha", 1, "MALE", "Cha"),
    G("me", 1, "FEMALE", "Máº¹"),
    G("tÃ´i", 2, "MALE", "TÃ´i"),
    G("vá»£", 2, "FEMALE", "Vá»£"),
    G("con1", 3, "MALE", "ConTrai"),
    G("con2", 3, "FEMALE", "ConGÃ¡i"),
    G("chÃ¡u", 4, "MALE", "ChÃ¡uTrai"),
  ],
  relationships: [
    rel("cha", "tÃ´i", "PARENT"),
    rel("cha", "me", "SPOUSE"),
    rel("tÃ´i", "vá»£", "SPOUSE"),
    rel("tÃ´i", "con1", "PARENT"),
    rel("tÃ´i", "con2", "PARENT"),
    rel("con1", "chÃ¡u", "PARENT"),
  ],
};
run("S4 children + grandchildren (no grandparent)", s4, "tÃ´i");

// ---- Scenario 5: 3 generations + chÃº/thÃ­m + con cÃ¡i ----
const s5: IDraftFamilyData = {
  family: { localId: "fam", name: "t", lineageType: "PATRIARCHAL", description: undefined },
  members: [
    G("Ã´ng0", 0, "MALE", "Ã”ng"),
    G("bÃ 0", 0, "FEMALE", "BÃ "),
    G("cha", 1, "MALE", "Cha"),
    G("me", 1, "FEMALE", "Máº¹"),
    G("chÃº", 1, "MALE", "ChÃº"),
    G("thÃ­m", 1, "FEMALE", "ThÃ­m"),
    G("tÃ´i", 2, "MALE", "TÃ´i"),
    G("vá»£", 2, "FEMALE", "Vá»£"),
    G("con1", 3, "FEMALE", "ConGÃ¡i"),
  ],
  relationships: [
    rel("Ã´ng0", "cha", "PARENT"),
    rel("Ã´ng0", "chÃº", "PARENT"),
    rel("Ã´ng0", "bÃ 0", "SPOUSE"),
    rel("cha", "me", "SPOUSE"),
    rel("chÃº", "thÃ­m", "SPOUSE"),
    rel("cha", "tÃ´i", "PARENT"),
    rel("tÃ´i", "vá»£", "SPOUSE"),
    rel("tÃ´i", "con1", "PARENT"),
  ],
};
run("S5 3 gen + chÃº/thÃ­m + con", s5, "tÃ´i");

console.log("\nDone.");

