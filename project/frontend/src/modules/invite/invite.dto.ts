export interface ICreateInviteDto {
  groupId: string;
  expiresAt: Date;
}
export interface IResponseCreateInviteDto {
  inviteLink: string;
}
