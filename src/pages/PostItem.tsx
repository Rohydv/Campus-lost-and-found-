import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertTriangle,
  Mail,
  Phone,
  ImageIcon,
  Camera,
  Lightbulb,
  Gift,
  Zap,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCreateItem, useUploadImage } from '../hooks/useItems';
import { ITEM_CATEGORIES, CAMPUS_LOCATIONS } from '../lib/utils';
import { Input, Textarea, Select } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import toast from 'react-hot-toast';

const schema = z.object({
  type: z.enum(['lost', 'found']),
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000),
  category: z.enum([
    'electronics','clothing','accessories','documents','keys','bags','books','sports','other',
  ]),
  location: z.string().min(2, 'Please specify a location'),
  date_occurred: z.string().min(1, 'Please enter the date'),
  contact_email: z.string().email('Please enter a valid email'),
  contact_phone: z.string().optional(),
  is_anonymous: z.boolean(),
  reward_offered: z.string().optional(),
  is_urgent: z.boolean(),
  distinguishing_marks: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const STEPS = [
  { id: 1, title: 'Item Type' },
  { id: 2, title: 'Details' },
  { id: 3, title: 'Contact' },
  { id: 4, title: 'Review' },
];

export function PostItem() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const createItem = useCreateItem();
  const uploadImage = useUploadImage();
  const [step, setStep] = useState(1);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    control,
    trigger,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'lost',
      is_anonymous: false,
      is_urgent: false,
      contact_email: profile?.email ?? user?.email ?? '',
      contact_phone: profile?.phone ?? '',
    },
  });

  const watchedType = watch('type');
  const isLost = watchedType === 'lost';

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const nextStep = async () => {
    let fields: (keyof FormData)[] = [];
    if (step === 1) fields = ['type'];
    if (step === 2) fields = ['title', 'description', 'category', 'location', 'date_occurred'];
    if (step === 3) fields = ['contact_email'];
    const valid = await trigger(fields);
    if (valid) setStep((s) => Math.min(s + 1, 4));
  };

  const onSubmit = async (data: FormData) => {
    try {
      let image_url: string | null = null;
      if (imageFile) {
        image_url = await uploadImage.mutateAsync(imageFile);
      }

      // Append extra info to description
      let fullDescription = data.description;
      if (data.distinguishing_marks?.trim()) {
        fullDescription += `\n\n🔍 Distinguishing marks: ${data.distinguishing_marks}`;
      }
      if (data.reward_offered?.trim()) {
        fullDescription += `\n\n🎁 Reward offered: ${data.reward_offered}`;
      }
      if (data.is_urgent) {
        fullDescription = `🚨 URGENT\n\n${fullDescription}`;
      }

      // Strip out UI-only fields that don't exist as DB columns.
      // Their values are already merged into fullDescription above.
      const { distinguishing_marks: _dm, reward_offered: _ro, is_urgent: _iu, ...dbData } = data;

      await createItem.mutateAsync({
        ...dbData,
        description: fullDescription,
        user_id: user!.id,
        status: 'active',
        image_url,
        contact_phone: data.contact_phone ?? null,
      });
      toast.success('Item reported successfully!');
      navigate('/dashboard');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to post item');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Report an Item</h1>
        <p className="text-slate-500 text-sm">Fill in the details to post a lost or found item</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step > s.id
                    ? 'bg-emerald-500 text-white'
                    : step === s.id
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {step > s.id ? <Check size={14} /> : s.id}
              </div>
              <span className={`hidden sm:block text-xs font-medium ${step === s.id ? 'text-blue-700' : 'text-slate-400'}`}>
                {s.title}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-8 sm:w-12 transition-all ${step > s.id ? 'bg-emerald-400' : 'bg-slate-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card padding="lg">

          {/* ── STEP 1: Item Type ── */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-900">What are you reporting?</h2>
              <div className="grid grid-cols-2 gap-4">
                {(['lost', 'found'] as const).map((t) => (
                  <Controller
                    key={t}
                    control={control}
                    name="type"
                    render={({ field }) => (
                      <button
                        type="button"
                        onClick={() => field.onChange(t)}
                        className={`p-6 rounded-2xl border-2 text-center transition-all ${
                          field.value === t
                            ? t === 'lost'
                              ? 'border-red-500 bg-red-50'
                              : 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-4xl mb-3">{t === 'lost' ? '😟' : '😊'}</div>
                        <p className={`font-bold text-lg ${t === 'lost' ? 'text-red-700' : 'text-blue-700'}`}>
                          {t === 'lost' ? 'I Lost Something' : 'I Found Something'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {t === 'lost'
                            ? 'Post a report and the campus community will help you find it'
                            : 'Let the owner know you have their item so they can claim it'}
                        </p>
                      </button>
                    )}
                  />
                ))}
              </div>

              {/* Tip box */}
              <div className={`rounded-xl p-4 flex gap-3 ${isLost ? 'bg-red-50 border border-red-100' : 'bg-blue-50 border border-blue-100'}`}>
                <Lightbulb size={16} className={`flex-shrink-0 mt-0.5 ${isLost ? 'text-red-500' : 'text-blue-500'}`} />
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isLost
                    ? 'Tip: Include as many details as possible — color, brand, model, any stickers or scratches. The more detail you add, the better chance someone recognizes it!'
                    : 'Tip: Upload a clear photo of the found item. This helps the owner recognize it quickly and makes it easier for you to verify ownership.'}
                </p>
              </div>
            </div>
          )}

          {/* ── STEP 2: Details ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Item Details</h2>
                {/* Urgent toggle */}
                <Controller
                  control={control}
                  name="is_urgent"
                  render={({ field }) => (
                    <button
                      type="button"
                      onClick={() => field.onChange(!field.value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${
                        field.value
                          ? 'bg-red-500 text-white border-red-500'
                          : 'border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-400'
                      }`}
                    >
                      <Zap size={12} />
                      {field.value ? 'URGENT' : 'Mark Urgent'}
                    </button>
                  )}
                />
              </div>

              {/* Photo Upload — Smart label based on type */}
              <div>
                <div className="flex items-start gap-2 mb-2">
                  <Camera size={15} className="text-slate-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {isLost
                        ? 'Old photo of your item (optional)'
                        : 'Photo of the found item (recommended)'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isLost
                        ? "Don't have it? That's okay — check your phone gallery, Google Photos, or any old screenshots. Even a partial photo helps!"
                        : 'Upload a clear photo of the item you found. This helps the owner verify it\'s theirs.'}
                    </p>
                  </div>
                </div>

                {imagePreview ? (
                  <div className="relative rounded-xl overflow-hidden h-48 bg-slate-100">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                    >
                      <X size={16} />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                      ✓ Photo added
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className={`w-full h-36 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-colors group ${
                      isLost
                        ? 'border-slate-200 hover:border-orange-300 hover:bg-orange-50/50'
                        : 'border-blue-200 hover:border-blue-400 hover:bg-blue-50/50 bg-blue-50/20'
                    }`}
                  >
                    <ImageIcon size={28} className={`transition-colors ${isLost ? 'text-slate-300 group-hover:text-orange-400' : 'text-blue-300 group-hover:text-blue-500'}`} />
                    <div className="text-center">
                      <span className={`text-sm block transition-colors ${isLost ? 'text-slate-400 group-hover:text-orange-600' : 'text-blue-400 group-hover:text-blue-600'}`}>
                        {isLost ? 'Click to upload an old photo' : 'Click to upload a photo'}
                      </span>
                      <span className="text-xs text-slate-300">PNG, JPG up to 5MB</span>
                    </div>
                    {!isLost && (
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                        Recommended for found items
                      </span>
                    )}
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </div>

              <Input
                label={`Item Title *`}
                placeholder={isLost ? 'e.g. Blue Samsung Galaxy S24 Ultra' : 'e.g. Found silver keychain near Main Library'}
                error={errors.title?.message}
                {...register('title')}
              />

              <Textarea
                label="Description *"
                placeholder={isLost
                  ? 'Describe the item in as much detail as possible — color, brand, model number, size, any personalization, stickers, scratches, etc.'
                  : 'Describe what you found — condition, where exactly, any identifying features visible on it.'}
                error={errors.description?.message}
                rows={4}
                {...register('description')}
              />

              {/* Distinguishing marks — NEW field */}
              <Textarea
                label="Distinguishing marks or features (optional)"
                placeholder={isLost
                  ? 'e.g. Has a crack on the bottom-left corner, custom blue case with a star sticker, engraved initials "RS" on back...'
                  : 'e.g. Has a name written inside, broken zipper on left side, has stickers on the cover...'}
                rows={2}
                hint="These unique details help the right person identify the item and prevent false claims."
                {...register('distinguishing_marks')}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Controller
                  control={control}
                  name="category"
                  render={({ field }) => (
                    <Select
                      label="Category *"
                      value={field.value}
                      onChange={field.onChange}
                      options={ITEM_CATEGORIES}
                      placeholder="Select category"
                      error={errors.category?.message}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="location"
                  render={({ field }) => (
                    <Select
                      label={isLost ? 'Where did you lose it? *' : 'Where did you find it? *'}
                      value={field.value}
                      onChange={field.onChange}
                      options={CAMPUS_LOCATIONS.map((l) => ({ value: l, label: l }))}
                      placeholder="Select location"
                      error={errors.location?.message}
                    />
                  )}
                />
              </div>

              <Input
                label={`Date ${isLost ? 'Lost' : 'Found'} *`}
                type="date"
                error={errors.date_occurred?.message}
                max={new Date().toISOString().split('T')[0]}
                hint={isLost ? "Approximate date is fine if you're not sure exactly." : undefined}
                {...register('date_occurred')}
              />

              {/* Reward field — only for lost items */}
              {isLost && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift size={15} className="text-amber-600" />
                    <p className="text-sm font-medium text-amber-800">Offering a reward? (optional)</p>
                  </div>
                  <Input
                    placeholder='e.g. "₹500 cash reward" or "Will treat to coffee!"'
                    hint="Mentioning a reward can motivate people to look harder and return your item."
                    {...register('reward_offered')}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: Contact ── */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-slate-900">Contact Information</h2>
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 border border-blue-100">
                <Info size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  {isLost
                    ? 'This is how the finder will reach you. Make sure it\'s correct!'
                    : 'This is how the owner will contact you to claim the item.'}
                </p>
              </div>
              <Input
                label="Email Address *"
                type="email"
                error={errors.contact_email?.message}
                leftIcon={<Mail size={15} />}
                {...register('contact_email')}
              />
              <Input
                label="Phone Number (optional)"
                type="tel"
                placeholder="+91 98765 43210"
                hint="Adding a phone number makes it easier to reach you quickly."
                leftIcon={<Phone size={15} />}
                {...register('contact_phone')}
              />
              <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <input
                  type="checkbox"
                  id="is_anonymous"
                  className="w-4 h-4 rounded accent-blue-600"
                  {...register('is_anonymous')}
                />
                <div>
                  <label htmlFor="is_anonymous" className="text-sm font-medium text-slate-700 cursor-pointer">
                    Post anonymously
                  </label>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Your name won't be shown publicly, but your contact details will remain visible.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 4: Review ── */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Review Your Report</h2>
              <div className="rounded-xl overflow-hidden border border-slate-100">
                {imagePreview ? (
                  <img src={imagePreview} alt="Item" className="w-full h-48 object-cover" />
                ) : (
                  <div className={`h-20 flex items-center justify-center text-sm ${isLost ? 'bg-red-50 text-red-400' : 'bg-blue-50 text-blue-400'}`}>
                    {isLost ? '📷 No photo — rely on description' : '📷 No photo attached'}
                  </div>
                )}
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full text-white ${isLost ? 'bg-red-500' : 'bg-blue-600'}`}>
                      {watchedType.toUpperCase()}
                    </span>
                    {watch('is_urgent') && (
                      <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-orange-500 text-white flex items-center gap-1">
                        <Zap size={10} /> URGENT
                      </span>
                    )}
                    <h3 className="font-semibold text-slate-900">{watch('title')}</h3>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-3">{watch('description')}</p>
                  {watch('distinguishing_marks') && (
                    <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">
                      🔍 <strong>Marks:</strong> {watch('distinguishing_marks')}
                    </p>
                  )}
                  {isLost && watch('reward_offered') && (
                    <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg">
                      🎁 <strong>Reward:</strong> {watch('reward_offered')}
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 pt-1 border-t border-slate-50">
                    <span>📂 {ITEM_CATEGORIES.find((c) => c.value === watch('category'))?.label}</span>
                    <span>📍 {watch('location')}</span>
                    <span>📅 {watch('date_occurred')}</span>
                    <span>✉ {watch('contact_email')}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-100">
                <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  By submitting, you confirm the information is accurate and agree to our community guidelines. False reports may result in account suspension.
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
            {step > 1 ? (
              <Button type="button" variant="secondary" onClick={() => setStep((s) => s - 1)} icon={<ChevronLeft size={16} />}>
                Back
              </Button>
            ) : (
              <div />
            )}
            {step < 4 ? (
              <Button type="button" onClick={nextStep} icon={<ChevronRight size={16} />}>
                Continue
              </Button>
            ) : (
              <Button type="submit" loading={createItem.isPending || uploadImage.isPending} icon={<Check size={16} />}>
                Submit Report
              </Button>
            )}
          </div>
        </Card>
      </form>
    </div>
  );
}
