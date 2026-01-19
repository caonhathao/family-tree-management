export interface CreateInviteDto {
  groupId: string;
  expiresAt: Date;
}
export interface ResponseCreateInviteDto {
  inviteLink: string;
}
