"use client";

import { CheckCircleIcon, DownloadSimpleIcon, EyeSlashIcon, LockKeyIcon, ShieldCheckIcon, TrashIcon } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import { useI18n } from "@/components/lang-provider";
import { useFitState } from "@/lib/fit-state";

const eventLabels = {
  anonymous_matching_enabled: ["Anonymous matching enabled", "已打开匿名匹配"],
  anonymous_matching_disabled: ["Anonymous matching turned off", "已关闭匿名匹配"],
  insights_enabled: ["Anonymous product insights enabled", "已打开匿名产品改进"],
  insights_disabled: ["Anonymous product insights turned off", "已关闭匿名产品改进"],
  exported: ["Private data copy downloaded", "已下载私人资料副本"],
  fit_data_erased: ["Private fit data cleared", "已清空私人尺码资料"],
} as const;

export function PrivacyCenter() {
  const { t, date } = useI18n();
  const { hydrated, privacy, privacyEvents, snapshots, tightsSnapshots, exportPrivateData, eraseFitData, updatePrivacy } = useFitState();
  const [confirmingErase, setConfirmingErase] = useState(false);
  const [erased, setErased] = useState(false);
  const recordCount = snapshots.length + tightsSnapshots.length;
  const latestEvent = privacyEvents[0];
  const on = t("On", "开");
  const off = t("Off", "关");

  function clearFitData() {
    eraseFitData();
    setConfirmingErase(false);
    setErased(true);
  }

  return <section className="privacy-center" aria-labelledby="privacy-center-title">
    <div className="privacy-center-intro">
      <p className="eyebrow"><LockKeyIcon size={13} /> {t("Privacy controls", "隐私设置")}</p>
      <h2 id="privacy-center-title">{t("You decide what stays private.", "什么保密，由你决定。")}</h2>
      <p>{t("Start with only a size or a preference. Measurements are optional, never visible to other members, and are not shared with brands or advertisers.", "只填一个尺码或偏好就能开始。尺寸是可选的，其他用户看不到，也不会分享给品牌或广告商。")}</p>
    </div>

    <div className="privacy-facts" aria-label={t("Private data summary", "私人资料概况")}>
      <article><EyeSlashIcon size={20} /><span>{t("Visible to others", "谁能看到")}</span><strong>{t("Only you", "只有你")}</strong></article>
      <article><ShieldCheckIcon size={20} /><span>{t("Used for", "用来做什么")}</span><strong>{t("Your private match", "你的私人匹配")}</strong></article>
      <article><LockKeyIcon size={20} /><span>{t("Saved history", "已存记录")}</span><strong>{hydrated ? t(`${recordCount} private ${recordCount === 1 ? "record" : "records"}`, `${recordCount} 条私人记录`) : t("Loading…", "读取中…")}</strong></article>
    </div>

    <div className="privacy-controls">
      <div className="privacy-choice">
        <div><strong>{t("Anonymous matching", "匿名匹配")}</strong><p>{t("Off by default. Turn this on only if you want de-identified fit signals to improve future “People Like You” guidance. No individual measurement is shown.", "默认关闭。只有你想用去掉身份信息的尺码数据，帮忙改进“和你相似的人”建议时才打开。不会显示任何个人尺寸。")}</p></div>
        <button type="button" className={`privacy-switch ${privacy.anonymousMatching ? "on" : ""}`} role="switch" aria-checked={privacy.anonymousMatching} onClick={() => { setErased(false); updatePrivacy({ anonymousMatching: !privacy.anonymousMatching }); }}><span></span><b>{privacy.anonymousMatching ? on : off}</b></button>
      </div>
      <div className="privacy-choice">
        <div><strong>{t("Anonymous product insights", "匿名产品改进")}</strong><p>{t("Off by default. This future-facing setting permits only aggregated product-improvement signals; the current demo does not send data to any outside party.", "默认关闭。这个设置以后只允许汇总后的产品改进数据；目前的版本不会把任何数据发给外部。")}</p></div>
        <button type="button" className={`privacy-switch ${privacy.aggregatedProductInsights ? "on" : ""}`} role="switch" aria-checked={privacy.aggregatedProductInsights} onClick={() => { setErased(false); updatePrivacy({ aggregatedProductInsights: !privacy.aggregatedProductInsights }); }}><span></span><b>{privacy.aggregatedProductInsights ? on : off}</b></button>
      </div>
    </div>

    <div className="privacy-actions">
      <div><strong>{t("Keep a copy or start fresh", "留一份副本，或者从头开始")}</strong><p>{t("This working demo stores profile information in this browser. A signed-in version keeps the same choices, plus account-level export and deletion requests.", "目前档案保存在这个浏览器里。登录版会保留同样的选择，并支持按账号导出和删除。")}</p></div>
      <div className="privacy-action-buttons"><button type="button" className="text-button" onClick={() => { setErased(false); exportPrivateData(); }}><DownloadSimpleIcon size={16} /> {t("Download my private data", "下载我的私人资料")}</button><button type="button" className="danger-button" onClick={() => setConfirmingErase(true)}><TrashIcon size={16} /> {t("Clear fit profile", "清空尺码档案")}</button></div>
    </div>

    {confirmingErase && <div className="privacy-confirm" role="alert"><div><strong>{t("Clear your private fit profile?", "确定清空你的私人尺码档案？")}</strong><p>{t("This removes bra and tights profile fields, dated fit history, and private wear notes from this browser. Saved product cards stay in your Passport.", "这会从这个浏览器里删除内衣和丝袜档案、尺码历史和私人试穿笔记。试穿册里收藏的产品会保留。")}</p></div><div><button type="button" className="text-button" onClick={() => setConfirmingErase(false)}>{t("Cancel", "取消")}</button><button type="button" className="danger-button" onClick={clearFitData}>{t("Yes, clear my fit data", "确定，清空")}</button></div></div>}
    {(erased || latestEvent) && <p className="privacy-last-action"><CheckCircleIcon size={14} /> {erased ? t("Your private fit fields and history were cleared in this browser.", "这个浏览器里的私人尺码资料和历史已清空。") : `${t(eventLabels[latestEvent.type][0], eventLabels[latestEvent.type][1])} · ${date(latestEvent.recordedAt)}`}</p>}
  </section>;
}
