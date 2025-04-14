'use client';

import { useState } from 'react';
import { CircleHelp } from 'lucide-react';
import { useTranslations } from 'next-intl';

// 定义常见问题类别
const FAQ_CATEGORIES = {
  ABOUT: 'about',
  USAGE: 'guide',
  TOOLS: 'tools',
  SUPPORT: 'support',
  TECHNICAL: 'tech',
};

interface FaqItemProps {
  question: string;
  answers: string[];
  isOpen: boolean;
  toggleOpen: () => void;
  category: string;
  id: string;
}

// 获取标签的背景和文本颜色
const getCategoryStyles = (category: string) => {
  switch (category) {
    case FAQ_CATEGORIES.ABOUT:
      return 'bg-blue-500/20 text-blue-400';
    case FAQ_CATEGORIES.USAGE:
      return 'bg-green-500/20 text-green-400';
    case FAQ_CATEGORIES.TOOLS:
      return 'bg-purple-500/20 text-purple-400';
    case FAQ_CATEGORIES.SUPPORT:
      return 'bg-orange-500/20 text-orange-400';
    default:
      return 'bg-gray-500/20 text-gray-400';
  }
};

// 获取标签的翻译文本
const getCategoryLabel = (category: string, t: (key: string) => string) => {
  switch (category) {
    case FAQ_CATEGORIES.ABOUT:
      return t('about');
    case FAQ_CATEGORIES.USAGE:
      return t('guide');
    case FAQ_CATEGORIES.TOOLS:
      return t('tools');
    case FAQ_CATEGORIES.SUPPORT:
      return t('support');
    default:
      return t('tech');
  }
};

function FaqItem({ question, answers, isOpen, toggleOpen, category, id }: FaqItemProps) {
  const t = useTranslations('Faq.tabs');
  const categoryStyles = getCategoryStyles(category);
  const categoryLabel = getCategoryLabel(category, t);

  return (
    <div className='bg-tap4-gray/10 mb-4 overflow-hidden rounded-xl border border-gray-800 transition-all duration-300 hover:border-blue-500/30'>
      <button
        type='button'
        onClick={toggleOpen}
        className='flex w-full items-center justify-between p-5 text-left transition-all duration-300'
      >
        <div className='flex items-start gap-3'>
          <div
            className={`mt-1 flex h-6 w-auto min-w-[60px] items-center justify-center rounded-full px-2 text-xs font-medium ${categoryStyles}`}
          >
            {categoryLabel}
          </div>
          <h3 className='text-lg font-medium'>{question}</h3>
        </div>
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full ${isOpen ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-700/50 text-gray-400'}`}
        >
          {isOpen ? '-' : '+'}
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className='space-y-3 border-t border-gray-800/50 px-5 py-4'>
          {answers.map((answer) => (
            <p key={`${id}-answer-${answer.substring(0, 10)}`} className='text-gray-300'>
              {answer}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Faq() {
  const t = useTranslations('Faq');
  const tabT = useTranslations('Faq.tabs');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // 重新组织FAQ内容，添加类别标签以便更好地分类和理解
  const faqItems = [
    {
      id: 'faq-1',
      question: t('1.question'),
      answers: [t('1.answer')],
      category: FAQ_CATEGORIES.ABOUT,
    },
    {
      id: 'faq-2',
      question: t('2.question'),
      answers: [t('2.answer-1'), t('2.answer-2'), t('2.answer-3')],
      category: FAQ_CATEGORIES.USAGE,
    },
    {
      id: 'faq-3',
      question: t('3.question'),
      answers: [t('3.answer-1'), t('3.answer-2')],
      category: FAQ_CATEGORIES.ABOUT,
    },
    {
      id: 'faq-4',
      question: t('4.question'),
      answers: [t('4.answer')],
      category: FAQ_CATEGORIES.SUPPORT,
    },
    {
      id: 'faq-5',
      question: t('5.question'),
      answers: [t('5.answer')],
      category: FAQ_CATEGORIES.TOOLS,
    },
    {
      id: 'faq-6',
      question: t('6.question'),
      answers: [t('6.answer')],
      category: FAQ_CATEGORIES.TECHNICAL,
    },
    {
      id: 'faq-7',
      question: t('7.question'),
      answers: [t('7.answer')],
      category: FAQ_CATEGORIES.TOOLS,
    },
    {
      id: 'faq-8',
      question: t('8.question'),
      answers: [t('8.answer')],
      category: FAQ_CATEGORIES.SUPPORT,
    },
    {
      id: 'faq-9',
      question: t('9.question'),
      answers: [t('9.answer')],
      category: FAQ_CATEGORIES.TECHNICAL,
    },
    {
      id: 'faq-10',
      question: t('10.question'),
      answers: [t('10.answer')],
      category: FAQ_CATEGORIES.USAGE,
    },
    {
      id: 'faq-11',
      question: t('11.question'),
      answers: [t('11.answer')],
      category: FAQ_CATEGORIES.ABOUT,
    },
  ];

  return (
    <div className='mx-auto max-w-4xl pb-16'>
      <div className='mb-8 flex items-center justify-center gap-3'>
        <div className='h-[1px] w-12 bg-gradient-to-r from-transparent to-gray-700' />
        <h2 className='flex items-center gap-2 text-center text-2xl font-bold lg:text-3xl'>
          <CircleHelp className='text-gray-400' size={24} /> {t('title')}
        </h2>
        <div className='h-[1px] w-12 bg-gradient-to-l from-transparent to-gray-700' />
      </div>

      <div className='mb-6 flex flex-wrap items-center justify-center gap-2 px-3'>
        <span className='rounded-full bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-400'>{tabT('about')}</span>
        <span className='rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400'>
          {tabT('guide')}
        </span>
        <span className='rounded-full bg-purple-500/20 px-3 py-1 text-xs font-medium text-purple-400'>
          {tabT('tools')}
        </span>
        <span className='rounded-full bg-orange-500/20 px-3 py-1 text-xs font-medium text-orange-400'>
          {tabT('support')}
        </span>
        <span className='rounded-full bg-gray-500/20 px-3 py-1 text-xs font-medium text-gray-400'>{tabT('tech')}</span>
      </div>

      <div className='space-y-2 px-3 lg:px-0'>
        {faqItems.map((item, index) => (
          <FaqItem
            key={item.id}
            id={item.id}
            question={item.question}
            answers={item.answers}
            isOpen={openIndex === index}
            toggleOpen={() => toggleFaq(index)}
            category={item.category}
          />
        ))}
      </div>
    </div>
  );
}
