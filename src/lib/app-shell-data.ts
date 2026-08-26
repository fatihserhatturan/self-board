export interface Team {
  slug: string;
  name: string;
  color: string;
  initial: string;
  prefix: string;
}

export const DEFAULT_TEAM: Team = {
  slug: "core",
  name: "Core Team",
  color: "bg-label-blue",
  initial: "C",
  prefix: "COR",
};

export const TEAMS: Team[] = [DEFAULT_TEAM];

export const CURRENT_USER = {
  name: "Fatih Turan",
  email: "turan.fatih@dgpaysit.com",
};

export const WORKSPACE = {
  name: "self-board",
};

export const INBOX_UNREAD_COUNT = 3;
