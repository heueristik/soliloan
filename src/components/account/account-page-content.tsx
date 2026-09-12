'use client';

import type { User } from '@prisma/client';
import { AlertTriangle, Bell, KeyRound, UserCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { FormSection } from '@/components/ui/form-section';
import { AccountSettingsForm } from './account-settings-form';
import { ChangePasswordForm } from './change-password-form';
import { DeleteAccountSection } from './delete-account-section';
import { ForumDigestDelayForm } from './forum-digest-delay-form';
import { ForumSubscriptionList, type ForumSubscriptionListProps } from './forum-subscription-list';

interface AccountPageContentProps {
  user: Pick<User, 'email' | 'name' | 'language'>;
  forumDigest?: {
    delayMinutes: number;
    boards: ForumSubscriptionListProps['boards'];
    threads: ForumSubscriptionListProps['threads'];
    mutes: ForumSubscriptionListProps['mutes'];
  } | null;
}

export function AccountPageContent({ user, forumDigest }: AccountPageContentProps) {
  const t = useTranslations('account');

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold tracking-tight">{t('title')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <FormSection title={t('profile.title')} icon={<UserCircle className="h-4 w-4 text-muted-foreground" />}>
          <AccountSettingsForm email={user.email} name={user.name} language={user.language} />
        </FormSection>

        <FormSection title={t('password.title')} icon={<KeyRound className="h-4 w-4 text-muted-foreground" />}>
          <ChangePasswordForm />
        </FormSection>

        {forumDigest ? (
          <div id="forum" className="lg:col-span-2">
            <FormSection
              title={t('forum.title')}
              description={t('forum.description')}
              icon={<Bell className="h-4 w-4 text-muted-foreground" />}
            >
              <ForumDigestDelayForm forumDigestDelayMinutes={forumDigest.delayMinutes} />
              <div className="space-y-2 pt-2">
                <h3 className="text-sm font-medium">{t('forum.subscriptions')}</h3>
                <ForumSubscriptionList
                  boards={forumDigest.boards}
                  threads={forumDigest.threads}
                  mutes={forumDigest.mutes}
                />
              </div>
            </FormSection>
          </div>
        ) : null}

        <FormSection title={t('deleteAccount.title')} icon={<AlertTriangle className="h-4 w-4 text-destructive" />}>
          <DeleteAccountSection />
        </FormSection>
      </div>
    </div>
  );
}
