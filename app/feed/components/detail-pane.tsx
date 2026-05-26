import type { BrandMentionDTO, LeadDTO, LeadReplyDTO, ReplyLength, XPostDTO } from "@/db/schemas/domain";
import { KeywordsDropdown } from "@/app/components/keywords-dropdown";
import { ReplyEditor } from "@/app/components/reply-editor";
import { ReadMarker } from "@/app/components/read-marker";
import { MentionReplyGenerator } from "@/app/mentions/mention-reply-generator";
import { generateLeadRepliesFromForm, updateLeadStatusFromForm } from "@/modules/leads/actions";
import { updateMentionStatusFromForm } from "@/modules/mentions/actions";
import { toReplyGenerationUiError } from "@/modules/replies/error-messages";
import { toRedditUrl } from "@/lib/utils";
import { formatDate } from "../feed-utils";
import { CheckIcon, SentimentPill, TargetBadge } from "./feed-ui";
import { XPostDetail } from "./x-post";

export function DetailPane({
  lead,
  mention,
  xPost,
  replies,
  projectId,
  replyLength,
  filterBase,
  copy,
}: {
  lead: LeadDTO | null;
  mention: BrandMentionDTO | null;
  xPost: XPostDTO | null;
  replies: LeadReplyDTO[];
  projectId: string;
  replyLength: ReplyLength;
  filterBase: string;
  copy: Record<string, string>;
}) {
  if (lead) return <LeadDetail lead={lead} replies={replies} projectId={projectId} replyLength={replyLength} filterBase={filterBase} copy={copy} />;
  if (mention) return <MentionDetail mention={mention} projectId={projectId} copy={copy} />;
  if (xPost) return <XPostDetail post={xPost} projectId={projectId} copy={copy} />;

  return (
    <section className="detail-pane" style={{ background: "#fff" }}>
      <div className="detail-content" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
        <svg width="96" height="96" viewBox="0 0 96 96" fill="none" aria-hidden="true">
          <rect x="12" y="28" width="72" height="52" rx="6" stroke="#E2E4E8" strokeWidth="3" fill="#F8F9FA" />
          <path d="M12 40l36 22 36-22" stroke="#E2E4E8" strokeWidth="3" strokeLinejoin="round" />
          <rect x="30" y="14" width="36" height="20" rx="4" fill="#fff" stroke="#E2E4E8" strokeWidth="2.5" />
          <line x1="37" y1="21" x2="59" y2="21" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" />
          <line x1="37" y1="27" x2="52" y2="27" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </section>
  );
}

function LeadDetail({
  lead,
  replies,
  projectId,
  replyLength,
  filterBase,
  copy,
}: {
  lead: LeadDTO;
  replies: LeadReplyDTO[];
  projectId: string;
  replyLength: ReplyLength;
  filterBase: string;
  copy: Record<string, string>;
}) {
  const isGenerating = lead.reply_generation_status === "generating";
  const failure = lead.reply_generation_error ? toReplyGenerationUiError(lead.reply_generation_error) : null;
  const returnTo = `/feed?${filterBase}&itemId=${lead.id}&itemType=opportunity`;
  const redditUrl = toRedditUrl(lead.permalink);

  return (
    <section className="detail-pane" aria-label="Lead detail">
      <ReadMarker itemId={lead.id} itemType="lead" projectId={projectId} />
      <div className="detail-topbar">
        <div className="opportunity-meta">
          <span
            className="opportunity-dot"
            style={{
              background:
                lead.status === "new" ? "#FF4500" : lead.status === "replied" ? "#46A758" : "#B0B0B5",
            }}
          />
          <span>r/{lead.subreddit}</span>
          {lead.created_utc && <span>{formatDate(lead.created_utc, copy)}</span>}
          {lead.author && <span>u/{lead.author}</span>}
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
          {lead.keywords_matched?.length > 0 && (
            <KeywordsDropdown keywords={lead.keywords_matched} />
          )}
          <form action={updateLeadStatusFromForm}>
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="leadId" value={lead.id} />
            <input type="hidden" name="status" value="irrelevant" />
            <input type="hidden" name="returnTo" value={`/feed?${filterBase}`} />
            <button className="btn-reject" type="submit">{copy.reject}</button>
          </form>
          <form action={updateLeadStatusFromForm}>
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="leadId" value={lead.id} />
            <input type="hidden" name="status" value="replied" />
            <input type="hidden" name="returnTo" value={returnTo} />
            <button className="btn-replied" type="submit">
              <CheckIcon />
              {copy.markReplied}
            </button>
          </form>
        </div>
      </div>

      <div className="detail-content">
        <h2 style={{ fontSize: 22, lineHeight: 1.2, letterSpacing: "-0.02em", fontWeight: 700, color: "#1A1A1B" }}>
          {lead.title}
        </h2>
        {lead.keywords_matched?.length > 0 && (
          <p style={{ fontSize: 11, color: "#7C7C83", fontWeight: 600, marginTop: 10 }}>
            {copy.keywords}: {lead.keywords_matched.slice(0, 3).join(", ")}
            {lead.keywords_matched.length > 3 ? ` +${lead.keywords_matched.length - 3}` : ""}
          </p>
        )}
      </div>

      <article className="lead-post">
        <p className="reddit-body" style={{ fontSize: 13 }}>
          {lead.body?.trim() || copy.noBodyReddit}
        </p>
        <div className="post-stats-bar">
          {(lead.score ?? 0) > 0 && <span>▲ {lead.score} {copy.upvotes}</span>}
          {lead.num_comments != null && <span>💬 {lead.num_comments} {copy.comments}</span>}
          <a href={redditUrl} target="_blank" rel="noreferrer" className="post-stats-link">
            {copy.viewReddit}
          </a>
        </div>
      </article>

      <div className="lead-comment-box">
        {failure && (
          <div style={{ padding: "10px 12px", borderRadius: 4, background: "#FBE2E5", border: "1px solid #F2B7BD", color: "#EA0027", fontSize: 12, marginBottom: 12 }}>
            {failure.kind === "limit" ? copy.errorLimit : failure.kind === "configuration" ? copy.errorConfiguration : copy.errorTemporary}
          </div>
        )}
        {isGenerating ? (
          <div style={{ padding: "14px 0", color: "#7C7C83", fontSize: 13, fontWeight: 600 }}>
            {copy.generatingReplies}
          </div>
        ) : (
          <ReplyEditor
            key={lead.id}
            replies={replies}
            permalink={lead.permalink}
            projectId={projectId}
            leadId={lead.id}
            returnTo={returnTo}
            replyLength={replyLength}
            generateForm={
              <form action={generateLeadRepliesFromForm}>
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="leadId" value={lead.id} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <button
                  type="submit"
                  className={`composer-btn${replies.length === 0 ? " composer-btn-accent" : ""}`}
                  disabled={failure ? !failure.canRetry : false}
                >
                  {failure?.canRetry
                    ? copy.retryGeneration
                    : replies.length > 0
                      ? copy.regenerate
                      : copy.generateReplySuggestions}
                </button>
              </form>
            }
          />
        )}
      </div>
    </section>
  );
}

function MentionDetail({ mention, projectId, copy }: { mention: BrandMentionDTO; projectId: string; copy: Record<string, string> }) {
  const redditUrl = toRedditUrl(mention.permalink);

  return (
    <section className="detail-pane" aria-label="Mention detail">
      <ReadMarker itemId={mention.id} itemType="mention" projectId={projectId} />
      <div className="detail-topbar">
        <div className="opportunity-meta">
          <TargetBadge type={mention.target_type} label={mention.target_label} />
          <span>r/{mention.subreddit}</span>
          {mention.posted_at && <span>{formatDate(mention.posted_at, copy)}</span>}
          {mention.author && <span>u/{mention.author}</span>}
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <SentimentPill sentiment={mention.sentiment} copy={copy} />
          <form action={updateMentionStatusFromForm}>
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="mentionId" value={mention.id} />
            <input type="hidden" name="status" value="replied" />
            <input type="hidden" name="returnTo" value={`/feed?type=mentions&projectId=${projectId}`} />
            <button className="btn-replied" type="submit">{copy.statusReplied}</button>
          </form>
        </div>
      </div>

      <div className="detail-content">
        <h2 style={{ fontSize: 22, lineHeight: 1.2, letterSpacing: "-0.02em", fontWeight: 700, color: "#1A1A1B" }}>
          {mention.title}
        </h2>
        {mention.sentiment_reason && (
          <p style={{ fontSize: 12, color: "#7C7C83", fontWeight: 600, marginTop: 10 }}>
            {mention.sentiment_reason}
          </p>
        )}
      </div>

      <article className="lead-post">
        <p className="reddit-body" style={{ fontSize: 13 }}>
          {mention.body?.trim() || copy.noBodyReddit}
        </p>
        <div className="post-stats-bar">
          {mention.reddit_score > 0 && <span>▲ {mention.reddit_score} {copy.upvotes}</span>}
          <span>💬 {mention.num_comments} {copy.comments}</span>
          <a href={redditUrl} target="_blank" rel="noreferrer" className="post-stats-link">
            {copy.viewReddit}
          </a>
        </div>
      </article>

      <div className="lead-comment-box">
        <MentionReplyGenerator
          key={mention.id}
          projectId={projectId}
          mentionId={mention.id}
          permalink={mention.permalink}
        />
      </div>
    </section>
  );
}
