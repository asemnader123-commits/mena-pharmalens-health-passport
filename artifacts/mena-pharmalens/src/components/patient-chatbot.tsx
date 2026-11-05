import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AlertTriangle, ArrowUp, MessageCircle, Sparkles } from 'lucide-react';

type PatientChatbotProps = {
  lang: 'en' | 'ar';
  audience: 'patient' | 'pharmacist';
  onSend: (message: string) => Promise<{ text: string; emergency?: boolean }>;
};

type ChatMessage = {
  id: number;
  role: 'patient' | 'assistant';
  text: string;
  emergency?: boolean;
};

const copy = {
  en: {
    title: 'PharmaLens assistant',
    subtitle: 'Medicine continuity, inventory, and your health passport',
    assistant: 'PharmaLens assistant',
    patient: 'You',
    welcome: 'Ask about your saved passport data, medicine names across countries, or pharmacy operations.',
    patientPrompts: [
      'Find a medicine name in another country',
      'What medicines are saved in my passport?',
      'How does temporary sharing work?',
      'Are lab results stored here?',
    ],
    pharmacistPrompts: [
      'Which items are nearing expiry?',
      'Summarize my current inventory',
      'Find a medicine brand in another country',
      'How does FEFO work?',
    ],
    placeholder: 'Write a message…',
    send: 'Send',
    sending: 'Preparing a response',
    disclaimer: 'For medical education only — not a diagnosis or a substitute for care from a qualified clinician.',
    emergencyTitle: 'Urgent medical attention may be needed',
    emergencyBody: 'If you may be in immediate danger, contact local emergency services now. Do not rely on this chat for emergency care.',
    textModelNotice: 'Answers use saved app data and built-in rules. No generative AI model or external provider is connected.',
    sendError: 'Your message could not be sent. Please try again.',
    emptyError: 'Write a message first.',
    ready: 'Ready for your question',
  },
  ar: {
    title: 'مساعد PharmaLens',
    subtitle: 'استمرارية الأدوية والمخزون والجواز الصحي',
    assistant: 'مساعد PharmaLens',
    patient: 'أنت',
    welcome: 'اسأل عن بيانات جوازك المحفوظة، أو أسماء الأدوية بين الدول، أو عمليات الصيدلية.',
    patientPrompts: [
      'ابحث عن اسم دواء في دولة أخرى',
      'ما الأدوية المسجلة في جوازي؟',
      'كيف تعمل المشاركة المؤقتة؟',
      'هل تُحفظ نتائج المختبر هنا؟',
    ],
    pharmacistPrompts: [
      'ما الأصناف القريبة من انتهاء الصلاحية؟',
      'لخّص المخزون الحالي',
      'ابحث عن اسم تجاري في دولة أخرى',
      'كيف يعمل FEFO؟',
    ],
    placeholder: 'اكتب رسالة…',
    send: 'إرسال',
    sending: 'جارٍ إعداد الرد',
    disclaimer: 'للتثقيف الطبي فقط — لا يُعد تشخيصًا ولا بديلًا عن رعاية مختص مؤهل.',
    emergencyTitle: 'قد تحتاج إلى عناية طبية عاجلة',
    emergencyBody: 'إذا كنت في خطر فوري، فاتصل بخدمات الطوارئ المحلية الآن. لا تعتمد على هذه المحادثة في حالات الطوارئ.',
    textModelNotice: 'تستخدم الردود بيانات التطبيق المحفوظة وقواعد مدمجة. لا يوجد نموذج توليدي أو مزود خارجي متصل.',
    sendError: 'تعذر إرسال رسالتك. حاول مرة أخرى.',
    emptyError: 'اكتب رسالة أولًا.',
    ready: 'جاهز لسؤالك',
  },
} as const;

export function PatientChatbot({ lang, audience, onSend }: PatientChatbotProps) {
  const t = copy[lang];
  const prompts = audience === 'patient' ? t.patientPrompts : t.pharmacistPrompts;
  const isArabic = lang === 'ar';
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const nextId = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, isSending]);

  const addMessage = (message: Omit<ChatMessage, 'id'>) => {
    nextId.current += 1;
    setMessages((current) => [...current, { ...message, id: nextId.current }]);
  };

  const sendMessage = async (value: string) => {
    const message = value.trim();
    if (!message) {
      setError(t.emptyError);
      return;
    }
    if (isSending) return;
    setError('');
    setDraft('');
    addMessage({ role: 'patient', text: message });
    setIsSending(true);
    try {
      const response = await onSend(message);
      addMessage({ role: 'assistant', text: response.text, emergency: response.emergency });
    } catch {
      setError(t.sendError);
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(draft);
  };

  return (
    <section
      dir={isArabic ? 'rtl' : 'ltr'}
      lang={lang}
      aria-label={t.title}
      data-testid="patient-chatbot"
      className="flex min-h-[34rem] w-full max-w-3xl flex-col overflow-hidden rounded-[1.6rem] border border-border bg-card shadow-[0_20px_60px_rgba(28,65,64,0.10)]"
    >
      <header className="flex items-center gap-3 border-b border-border bg-secondary/55 px-4 py-4 sm:px-6">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
          <MessageCircle size={20} strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-base font-extrabold tracking-tight text-foreground">{t.title}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{t.subtitle}</p>
        </div>
      </header>
      <p role="status" data-testid="status-no-text-ai" className="border-b border-border bg-accent/5 px-4 py-2.5 text-center text-xs leading-relaxed text-muted-foreground sm:px-6">
        {t.textModelNotice}
      </p>

      <div className="flex min-h-0 flex-1 flex-col bg-background/45">
        <div
          className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6"
          role="log"
          aria-live="polite"
          aria-relevant="additions text"
          data-testid="chat-message-list"
        >
          {messages.length === 0 && (
            <div className="flex items-start gap-3" data-testid="message-welcome">
              <span className="grid size-8 shrink-0 place-items-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
                <Sparkles size={15} />
              </span>
              <div className="max-w-[88%] rounded-2xl rounded-ss-sm border border-border bg-card px-4 py-3 text-sm leading-relaxed text-foreground shadow-sm">
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-primary">{t.assistant}</p>
                <p>{t.welcome}</p>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'patient'
                  ? isArabic ? 'justify-start' : 'justify-end'
                  : isArabic ? 'justify-end' : 'justify-start'
              }`}
              data-testid={`message-${message.role}-${message.id}`}
            >
              {message.emergency ? (
                <div
                  role="alert"
                  data-testid={`alert-emergency-${message.id}`}
                  className="w-full max-w-[92%] rounded-2xl border border-destructive/35 bg-destructive/5 p-4 sm:max-w-[86%]"
                >
                  <div className="mb-2 flex items-center gap-2 text-destructive">
                    <AlertTriangle size={17} />
                    <p className="text-xs font-extrabold">{t.emergencyTitle}</p>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{message.text}</p>
                  <p className="mt-3 border-t border-destructive/15 pt-3 text-xs font-semibold leading-relaxed text-destructive">
                    {t.emergencyBody}
                  </p>
                </div>
              ) : (
                <div
                  className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    message.role === 'patient'
                      ? 'rounded-ee-sm bg-primary text-primary-foreground shadow-sm'
                      : 'rounded-ss-sm border border-border bg-card text-foreground shadow-sm'
                  }`}
                >
                  <p className={`mb-1.5 text-[10px] font-bold uppercase tracking-[.12em] ${message.role === 'patient' ? 'text-primary-foreground/70' : 'text-primary'}`}>
                    {message.role === 'patient' ? t.patient : t.assistant}
                  </p>
                  {message.text}
                </div>
              )}
            </div>
          ))}

          {isSending && (
            <div className="flex justify-start" data-testid="status-typing" aria-label={t.sending}>
              <div className="flex items-center gap-2.5 rounded-2xl rounded-ss-sm border border-border bg-card px-4 py-3 text-xs font-medium text-muted-foreground shadow-sm">
                <span className="flex gap-1" aria-hidden="true">
                  <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                  <span className="size-1.5 animate-pulse rounded-full bg-primary [animation-delay:150ms]" />
                  <span className="size-1.5 animate-pulse rounded-full bg-primary [animation-delay:300ms]" />
                </span>
                {t.sending}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {messages.length === 0 && (
          <div className="px-4 pb-4 sm:px-6" data-testid="suggested-prompts">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">{t.ready}</p>
            <div className="flex flex-wrap gap-2">
              {prompts.map((prompt, index) => (
                <button
                  key={prompt}
                  type="button"
                  data-testid={`button-suggested-prompt-${index + 1}`}
                  disabled={isSending}
                  onClick={() => void sendMessage(prompt)}
                  className="rounded-full border border-primary/20 bg-card px-3 py-2 text-start text-xs font-semibold text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div role="alert" data-testid="status-chat-error" className="mx-4 mb-3 rounded-xl border border-destructive/25 bg-destructive/5 px-3.5 py-2.5 text-xs font-semibold leading-relaxed text-destructive sm:mx-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="border-t border-border bg-card/80 p-3 sm:px-5 sm:py-4" data-testid="form-chat-message">
          <div className="flex items-end gap-2 rounded-2xl border border-input bg-background p-1.5 shadow-sm transition focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10">
            <textarea
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                if (error) setError('');
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage(draft);
                }
              }}
              rows={1}
              placeholder={t.placeholder}
              aria-label={t.placeholder}
              data-testid="input-chat-message"
              className="max-h-32 min-h-10 flex-1 resize-y bg-transparent px-3 py-2.5 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/75"
              disabled={isSending}
            />
            <button
              type="submit"
              disabled={isSending || !draft.trim()}
              data-testid="button-send-message"
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <span>{t.send}</span>
              <ArrowUp size={15} />
            </button>
          </div>
          <p className="mt-3 px-1 text-center text-[10px] leading-relaxed text-muted-foreground" data-testid="text-medical-disclaimer">
            {t.disclaimer}
          </p>
        </form>
      </div>
    </section>
  );
}

export default PatientChatbot;
