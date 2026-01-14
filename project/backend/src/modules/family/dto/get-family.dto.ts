export class GetFamilyDto {
  id: string;
  name: string;
  description: string;
  owner: {
    id: string;
    userProfile: {
      fullName: string;
      avatar: string | null;
    }[];
  };
  _count: {
    familyMembers: number;
    albums: number;
    events: number;
    activityLogs: number;
  };
}
