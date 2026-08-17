import { IResponseUserDto } from "@/modules/user/user.dto";
import { GENDERS } from "@/types/enums";
import { createSlice } from "@reduxjs/toolkit";

//storing user's profile
interface UserState {
  profile: IResponseUserDto;
}

const initialState: UserState = {
  profile: {
    email: "",
    id: "",
    userProfile: {
      avatar: "",
      biography: "",
      dateOfBirth: "",
      fullName: "",
      gender: GENDERS.UNKNOWN,
    },
    groups: 0,
    invites: 0,
  },
};

const userSlide = createSlice({
  name: "user",
  initialState,
  reducers: {
    setProfile: (state, action) => {
      state.profile = action.payload;
    },
    clearProfile: (state) => {
      state.profile = initialState.profile;
    },
  },
});

export const { setProfile, clearProfile } = userSlide.actions;
export default userSlide.reducer;
