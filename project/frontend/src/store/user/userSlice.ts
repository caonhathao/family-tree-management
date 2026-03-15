import { IResponseUserDto } from "@/modules/user/user.dto";
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
      gender: "UNKNOWN",
    },
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
