import api from "./api";
import { Endpoints } from "../constants/api";

export type SkillSource = "official" | "ai_generated";

export interface Skill {
  id: string;
  kind?: "skill" | "provider";
  name: string;
  description: string;
  icon: string;
  category: string;
  source: SkillSource;
  created_at: string;
  provider_meta?: {
    key: string;
    auth_kind: "none" | "oauth2" | "apikey" | "lan_pair";
    connection_status: string | null;
    connection_id: string | null;
  };
}

export interface SkillDetail extends Skill {
  scene_template: any;
  ai_hint: string;
  is_installed_in_home: boolean;
}

export interface Installation {
  id: string;
  home_id: string;
  scene_id: string | null;
  installed_at: string;
  skill: Skill;
}

export async function listSkills(opts?: {
  category?: string;
  source?: "official" | "mine";
  kind?: "skill" | "provider" | "all";
  home_id?: string;
}): Promise<Skill[]> {
  const params: Record<string, string> = {};
  if (opts?.category) params.category = opts.category;
  if (opts?.source) params.source = opts.source;
  if (opts?.kind) params.kind = opts.kind;
  if (opts?.home_id) params.home_id = opts.home_id;
  const { data } = await api.get<Skill[]>(Endpoints.marketplace.skills, { params });
  return data;
}

export async function getSkill(id: string, homeId?: string): Promise<SkillDetail> {
  const params = homeId ? { home_id: homeId } : undefined;
  const { data } = await api.get<SkillDetail>(Endpoints.marketplace.skillDetail(id), { params });
  return data;
}

export async function aiGenerateSkill(homeId: string, prompt: string): Promise<Skill> {
  const { data } = await api.post<Skill>(Endpoints.marketplace.aiGenerate, {
    home_id: homeId, prompt,
  });
  return data;
}

export async function listInstallations(homeId: string): Promise<Installation[]> {
  const { data } = await api.get<Installation[]>(Endpoints.marketplace.installations(homeId));
  return data;
}

export async function installSkill(homeId: string, skillId: string): Promise<Installation> {
  const { data } = await api.post<Installation>(
    Endpoints.marketplace.installations(homeId),
    { skill_id: skillId },
  );
  return data;
}

export async function uninstallSkill(installationId: string): Promise<void> {
  await api.delete(Endpoints.marketplace.uninstall(installationId));
}
