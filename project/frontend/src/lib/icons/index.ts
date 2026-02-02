// src/icons/index.ts

// 🧠 Base type cho tất cả icon
import type { IconType } from 'react-icons';

// -------------------------
// 🎨 Ant Design Icons
// -------------------------
import * as AiIcons from 'react-icons/ai';
export const Ai = AiIcons;
export type AntDesignIcon = IconType;

// -------------------------
// 🌟 Font Awesome Icons
// -------------------------
import * as FaIcons from 'react-icons/fa';
export const Fa = FaIcons;
export type FontAwesomeIcon = IconType;

// -------------------------
// 🌟 Font Awesome Icons 6
// -------------------------
import * as Fa6Icons from 'react-icons/fa6';
export const Fa6 = Fa6Icons;
export type Font6AwesomeIcon = IconType;

// -------------------------
// 💼 Bootstrap Icons
// -------------------------
import * as BsIcons from 'react-icons/bs';
export const Bs = BsIcons;
export type BootstrapIcon = IconType;

// -------------------------
// ⚙️ Material Design Icons
// -------------------------
import * as MdIcons from 'react-icons/md';
export const Md = MdIcons;
export type MaterialIcon = IconType;

// -------------------------
// 💡 Box Icons
// -------------------------
import * as BiIcons from 'react-icons/bi';
export const Bi = BiIcons;
export type BoxIcon = IconType;

// -------------------------
// 🧾 Remix Icons
// -------------------------
import * as RiIcons from 'react-icons/ri';
export const Ri = RiIcons;
export type CircumIcon = IconType;

// -------------------------
// 🧾 Circum Icons
// -------------------------
import * as CiIcons from 'react-icons/ci';
export const Ci = CiIcons;
export type RemixIcon = IconType;

// -------------------------
// 🧱 Hero Icons (Outline)
// -------------------------
import * as HiIcons from 'react-icons/hi2'; // hi2 = phiên bản HeroIcons v2
export const Hi = HiIcons;
export type HeroIcon = IconType;

// -------------------------
// 🧱 Github Octions icons
// -------------------------
import * as GoIcons from 'react-icons/go';
export const go = GoIcons;
export type GithubOctionsIcons = IconType;

// -------------------------
// 🧱 Ionicons 5
// -------------------------
import * as Ionicons from 'react-icons/io5';
export const io5 = Ionicons;
export type IoniconsIcons = IconType;

// -------------------------
// ✅ Xuất type chung (tuỳ chọn)
export type AppIcon = IconType;