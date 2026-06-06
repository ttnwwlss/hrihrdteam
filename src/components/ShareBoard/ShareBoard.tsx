import React, { useState } from 'react';
import { SharePost, Member } from '../../types';
import { dbService } from '../../services/dbService';
import { 
  Search, 
  Plus, 
  Trash2, 
  Link as LinkIcon, 
  MessageSquare, 
  User, 
  Calendar,
  Hash,
  ExternalLink,
  Info,
  AlertTriangle
} from 'lucide-react';

interface ShareBoardProps {
  members: Member[];
  posts: SharePost[];
  onUpdatePosts: () => void;
}

// HSL based custom tag coloring based on its string value hashing
const getTagStyles = (tag: string) => {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return {
    backgroundColor: `hsl(${hue}, 85%, 96%)`,
    borderColor: `hsl(${hue}, 50%, 88%)`,
    color: `hsl(${hue}, 75%, 32%)`,
  };
};

const getLinkBadgeStyles = (url: string) => {
  const lower = url.toLowerCase();
  if (lower.includes('docs.google.com') || lower.includes('drive.google.com') || lower.includes('spreadsheets')) {
    return {
      label: 'Google Workspace',
      className: 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-250',
      iconColor: 'text-emerald-500'
    };
  }
  if (lower.includes('notion.so') || lower.includes('notion.site')) {
    return {
      label: 'Notion',
      className: 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100 hover:border-slate-300',
      iconColor: 'text-slate-655 text-slate-600'
    };
  }
  if (lower.includes('github.com')) {
    return {
      label: 'GitHub',
      className: 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800',
      iconColor: 'text-slate-300'
    };
  }
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    return {
      label: 'YouTube',
      className: 'bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100 hover:border-rose-200',
      iconColor: 'text-rose-500'
    };
  }
  return {
    label: '공유 링크',
    className: 'bg-cyan-50 border-cyan-100 text-cyan-600 hover:bg-cyan-100/50 hover:border-cyan-200',
    iconColor: 'text-cyan-500'
  };
};

const extractUrls = (text: string): string[] => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
};

const extractHashtags = (text: string): string[] => {
  const hashtagRegex = /#([ㄱ-ㅎㅏ-ㅣ가-힣a-zA-Z0-9_]+)/g;
  const matches = text.match(hashtagRegex) || [];
  return Array.from(new Set(matches));
};

export default function ShareBoard({
  members,
  posts,
  onUpdatePosts
}: ShareBoardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedAuthorId, setSelectedAuthorId] = useState('');
  const [isSubmitError, setIsSubmitError] = useState(false);

  // Extract and sort all unique hashtags by occurrence frequency
  const allHashtags = React.useMemo(() => {
    const tagCountMap: Record<string, number> = {};
    posts.forEach(post => {
      if (post.is_active && post.tags) {
        post.tags.forEach(tag => {
          tagCountMap[tag] = (tagCountMap[tag] || 0) + 1;
        });
      }
    });
    
    return Object.keys(tagCountMap).sort((a, b) => {
      const freqDiff = tagCountMap[b] - tagCountMap[a];
      if (freqDiff !== 0) return freqDiff;
      return a.localeCompare(b);
    });
  }, [posts]);

  // Filter posts based on search query (content, tags, or author name)
  const filteredPosts = posts.filter(post => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;

    const authorName = members.find(m => m.id === post.author_id)?.name || '';
    const matchContent = post.content.toLowerCase().includes(q);
    const matchTags = post.tags.some(tag => tag.toLowerCase().includes(q));
    const matchAuthor = authorName.toLowerCase().includes(q);

    return matchContent || matchTags || matchAuthor;
  });

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || !selectedAuthorId) {
      setIsSubmitError(true);
      return;
    }

    setIsSubmitError(false);

    const tags = extractHashtags(newPostContent);
    const links = extractUrls(newPostContent);

    const newPost: SharePost = {
      id: `post_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      author_id: selectedAuthorId,
      content: newPostContent.trim(),
      tags,
      links,
      created_at: new Date().toISOString(),
      is_active: true
    };

    await dbService.saveSharePost(newPost);
    setNewPostContent('');
    onUpdatePosts();
  };

  const handleDeletePost = async (id: string) => {
    if (window.confirm('이 공유글을 삭제하시겠습니까?')) {
      await dbService.deleteSharePost(id);
      onUpdatePosts();
    }
  };

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hour = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${day} ${hour}:${min}`;
  };

  return (
    <div className="space-y-6">
      {/* Title block & Search/Hashtags Row */}
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              📢 운영정보 공유 게시판
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              연수원 가이드라인, 매뉴얼 링크, 긴급 대응 팁 등을 자유롭게 기록하고 공유하는 공간입니다.
            </p>
          </div>

          {/* Search Input bar */}
          <div className="relative max-w-xs w-full sm:w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="본문, 태그, 작성자 검색..."
              className="w-full text-xs border border-slate-300 rounded-xl pl-9 pr-3 py-2 outline-none focus:border-cyan-600 bg-white"
            />
          </div>
        </div>

        {/* Quick Tag Search Filter Chips */}
        {allHashtags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-100/50">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1 select-none flex items-center gap-0.5">
              <Hash size={10} /> 자주 찾는 태그:
            </span>
            {allHashtags.map(tag => {
              const isActive = searchQuery.toLowerCase().trim() === tag.toLowerCase();
              const style = getTagStyles(tag);
              return (
                <button
                  key={tag}
                  onClick={() => {
                    if (isActive) {
                      setSearchQuery('');
                    } else {
                      setSearchQuery(tag);
                    }
                  }}
                  style={isActive ? style : {}}
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border shadow-3xs cursor-pointer transition-all ${
                    isActive 
                      ? 'border-indigo-200 font-black scale-103 shadow-xs' 
                      : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-[9px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-lg cursor-pointer ml-1"
              >
                필터 해제 ✕
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Write Post Panel */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
            <Plus size={14} className="text-cyan-600" />
            새 정보 공유하기
          </h4>

          <form onSubmit={handleCreatePost} className="space-y-3.5">
            {/* Author selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500">작성 담당자</label>
              <select
                value={selectedAuthorId}
                onChange={(e) => setSelectedAuthorId(e.target.value)}
                className={`w-full text-xs border rounded-xl px-2.5 py-2.5 bg-slate-50 outline-none cursor-pointer ${
                  isSubmitError && !selectedAuthorId ? 'border-rose-455 border-rose-500' : 'border-slate-300'
                }`}
              >
                <option value="">담당자를 선택하세요</option>
                {members.filter(m => m.is_active).map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.position})
                  </option>
                ))}
              </select>
            </div>

            {/* Content Textarea */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500">공유할 내용 (해시태그 및 URL 자동 감지)</label>
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="내용을 작성하세요. #해시태그나 공유할 사이트 링크(https://...)를 포함하여 자유롭게 입력하면 자동으로 정리됩니다."
                rows={6}
                className={`w-full text-xs border rounded-xl p-3 outline-none focus:border-cyan-600 bg-white resize-none leading-relaxed ${
                  isSubmitError && !newPostContent.trim() ? 'border-rose-455 border-rose-500' : 'border-slate-300'
                }`}
              />
            </div>

            {isSubmitError && (!selectedAuthorId || !newPostContent.trim()) && (
              <p className="text-[10px] text-rose-600 font-bold">
                ※ 작성자와 본문 내용을 모두 입력해야 공유할 수 있습니다.
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
            >
              <MessageSquare size={14} />
              <span>정보 공유 글 등록</span>
            </button>
          </form>

          {/* Guide tip */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2">
            <h5 className="text-[10px] font-black text-slate-655 text-slate-600 flex items-center gap-1">
              <Info size={12} className="text-cyan-600" />
              스마트 입력 사용법
            </h5>
            <ul className="text-[9.5px] text-slate-500 space-y-1 list-disc pl-3 leading-normal font-medium">
              <li>글에 <strong>#해시태그</strong>를 적으면 하단에 컬러풀한 뱃지로 파싱되어 검색 키워드로 작동합니다.</li>
              <li>글 안에 <strong>https://...</strong> 링크를 첨부하면 클릭 시 새 창으로 바로가기 버튼이 자동 생성됩니다.</li>
            </ul>
          </div>

          {/* Safety Warning */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-3.5 space-y-1.5 animate-pulse-subtle">
            <h5 className="text-[10px] font-black text-amber-800 flex items-center gap-1.5">
              <AlertTriangle size={12} className="text-amber-600" />
              보안 주의사항
            </h5>
            <p className="text-[9.5px] text-amber-700 leading-normal font-bold">
              정보 보호가 되지 않을 수도 있어요. 비밀번호나 중요한 정보는 올리지 말아주세용!
            </p>
          </div>
        </div>

        {/* Posts List List */}
        <div className="lg:col-span-2 space-y-4 max-h-[700px] overflow-y-auto pr-1">
          {filteredPosts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 py-20 text-center text-xs text-slate-400 font-bold italic">
              {searchQuery ? '검색어와 매칭되는 공유글이 없습니다.' : '등록된 정보 공유글이 없습니다. 첫 소식을 남겨보세요!'}
            </div>
          ) : (
            filteredPosts.map(post => {
              const author = members.find(m => m.id === post.author_id);
              const authorName = author ? author.name : '퇴사자/미지정';
              const authorRole = author ? author.position : '담당자';

              return (
                <div 
                  key={post.id} 
                  className="bg-white border border-slate-200 rounded-3xl p-5 shadow-3xs hover:shadow-xs transition-shadow relative group space-y-3.5"
                >
                  {/* Card Header info */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                        <User size={14} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-slate-900 text-xs">{authorName}</span>
                          <span className="text-[9px] bg-slate-100 border border-slate-200 text-slate-500 font-bold px-1.5 py-0.2 rounded-md">{authorRole}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[9px] text-slate-400 font-medium mt-0.5">
                          <Calendar size={10} />
                          <span>{formatDate(post.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Delete button (visible on hover) */}
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="p-1.5 text-slate-350 hover:text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                      title="이 공유글 삭제"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Body Content */}
                  <p className="text-xs text-slate-750 font-medium leading-relaxed whitespace-pre-wrap">
                    {post.content}
                  </p>

                  {/* Dynamic parsed hashtags line */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1.5">
                      {post.tags.map(tag => {
                        const style = getTagStyles(tag);
                        return (
                          <span 
                            key={tag}
                            style={style}
                            className="text-[10px] font-extrabold px-2 py-0.5 rounded-lg border shadow-3xs flex items-center gap-0.5 select-none"
                          >
                            <Hash size={10} />
                            <span>{tag.replace('#', '')}</span>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Links attached row */}
                  {post.links && post.links.length > 0 && (
                    <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-3 mt-3">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">공유 링크 및 프리뷰</span>
                      
                      {/* Badge Links */}
                      <div className="flex flex-wrap gap-2">
                        {post.links.map((link, idx) => {
                          const badge = getLinkBadgeStyles(link);
                          return (
                            <a 
                              key={idx}
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`text-[10px] font-bold border px-2.5 py-1.5 rounded-xl shadow-3xs flex items-center gap-1.5 transition-colors w-fit max-w-full truncate ${badge.className}`}
                            >
                              <LinkIcon size={11} className={`shrink-0 ${badge.iconColor}`} />
                              <span className="text-[9px] font-extrabold uppercase px-1 py-0.2 bg-white/60 rounded border border-black/5 text-slate-500 shrink-0">
                                {badge.label}
                              </span>
                              <span className="truncate max-w-[150px] sm:max-w-[200px]">{link}</span>
                              <ExternalLink size={10} className="shrink-0" />
                            </a>
                          );
                        })}
                      </div>

                      {/* Image Thumbnail Previews */}
                      {post.links.filter(link => {
                        const cleanUrl = link.split('?')[0].toLowerCase();
                        return cleanUrl.endsWith('.png') || 
                               cleanUrl.endsWith('.jpg') || 
                               cleanUrl.endsWith('.jpeg') || 
                               cleanUrl.endsWith('.gif') || 
                               cleanUrl.endsWith('.webp') || 
                               cleanUrl.endsWith('.svg');
                      }).length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {post.links.filter(link => {
                            const cleanUrl = link.split('?')[0].toLowerCase();
                            return cleanUrl.endsWith('.png') || 
                                   cleanUrl.endsWith('.jpg') || 
                                   cleanUrl.endsWith('.jpeg') || 
                                   cleanUrl.endsWith('.gif') || 
                                   cleanUrl.endsWith('.webp') || 
                                   cleanUrl.endsWith('.svg');
                          }).map((imgLink, imgIdx) => (
                            <a 
                              key={imgIdx} 
                              href={imgLink} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="block overflow-hidden rounded-2xl border border-slate-200/80 hover:border-cyan-500 transition-all shadow-3xs group/img"
                            >
                              <img 
                                src={imgLink} 
                                alt="Link preview" 
                                className="max-w-xs max-h-32 object-cover group-hover/img:scale-103 transition-transform duration-200"
                              />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
}
