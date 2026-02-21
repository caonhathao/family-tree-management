import { IResponseGetUserDto } from "@/modules/user/user.dto";
import { createSlice } from "@reduxjs/toolkit";

//storing user's profile
interface UserState {
  profile: IResponseGetUserDto;
}

const initialState: UserState = {
  profile: {
    email: "",
    id: "",
    userProfile: {
      avatar: "",
      biography: "",
      dateOfBirth: new Date(),
      fullName: "",
    },
  },
};

const userSlide = createSlice({
  name: "userProfile",
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
