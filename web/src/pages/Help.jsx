import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, HelpCircle } from 'lucide-react';
import * as contentApi from '../api/content.api';

export default function Help() {
  const { data, isLoading } = useQuery({
    queryKey: ['public-content', 'knowledge_base'],
    queryFn: () => contentApi.getPublicContent({ type: 'knowledge_base' }),
  });

  const articles = data?.data?.data?.content || [];
  const [openId, setOpenId] = useState(null);

  return (
    <div className="container py-12 max-w-3xl">
      <div className="text-center mb-10">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/30">
          <HelpCircle className="h-6 w-6 text-primary-600" />
        </div>
        <h1 className="text-3xl font-bold">Yordam</h1>
        <p className="text-gray-500 mt-2">Ko'p beriladigan savollarga javoblar</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-5 h-16 animate-pulse bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>Hozircha yordam maqolalari yo'q.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => {
            const isOpen = openId === article.id;
            return (
              <div key={article.id} className="card overflow-hidden">
                <button
                  onClick={() => setOpenId(isOpen ? null : article.id)}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left"
                >
                  <span className="font-semibold">{article.name}</span>
                  <ChevronDown
                    className={`h-5 w-5 flex-shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">
                    {article.body}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
