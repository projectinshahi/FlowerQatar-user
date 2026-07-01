"use client";

import { useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { categorySchema, type CategoryFormData } from '@/lib/validations/category';
import { toast } from 'sonner';
import { X, UploadCloud, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface CategoryFormProps {
  initialData?: CategoryFormData & { id: string };
  isEdit?: boolean;
}

export default function CategoryForm({ initialData, isEdit }: CategoryFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: initialData || {
      name: '',
      image: '',
      imagePublicId: '',
      exploreMore: false,
      hoverColor: '#A83A22',
      status: true,
      displayOrder: 0,
    }
  });

  const imageUrl = watch('image');
  const hoverColor = watch('hoverColor');

  const uploadImageToCloudinary = async (file: File) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Get signature
      const sigRes = await fetch('/api/admin/cloudinary/signature');
      if (!sigRes.ok) throw new Error('Failed to get signature');
      const { signature, timestamp, apiKey, cloudName } = await sigRes.json();

      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp.toString());
      formData.append('signature', signature);
      
      // We will use XMLHttpRequest to track progress
      return new Promise<{ url: string, public_id: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);
        
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(percent);
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            resolve({
              url: response.secure_url,
              public_id: response.public_id
            });
          } else {
            reject(new Error('Upload failed'));
          }
        };

        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.send(formData);
      });
      
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload image');
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPG, PNG and WEBP are allowed');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    try {
      const { url, public_id } = await uploadImageToCloudinary(file);
      setValue('image', url, { shouldValidate: true });
      setValue('imagePublicId', public_id, { shouldValidate: true });
      toast.success('Image uploaded successfully');
    } catch (error) {
      // Error is handled in upload function
    }
  };

  const removeImage = () => {
    setValue('image', '', { shouldValidate: true });
    setValue('imagePublicId', '', { shouldValidate: true });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onSubmit = async (data: CategoryFormData) => {
    try {
      setIsLoading(true);
      const url = isEdit ? `/api/admin/categories/${initialData?.id}` : '/api/admin/categories';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Something went wrong');
      }

      toast.success(isEdit ? 'Category updated successfully' : 'Category created successfully');
      router.push('/admin/categories');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100" suppressHydrationWarning>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Column */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category Name *</label>
            <input 
              {...register('name')}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#A83A22] focus:border-transparent outline-none transition"
              placeholder="e.g. Indoor Plants"
              suppressHydrationWarning
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hover Color *</label>
            <Controller
              name="hoverColor"
              control={control}
              render={({ field: { onChange, value } }) => (
                <div className="flex gap-4 items-center">
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value.toUpperCase())}
                    className="w-12 h-12 p-1 border border-gray-200 rounded cursor-pointer"
                    suppressHydrationWarning
                  />
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value.toUpperCase())}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#A83A22] focus:border-transparent outline-none transition uppercase"
                    placeholder="#A83A22"
                    suppressHydrationWarning
                  />
                </div>
              )}
            />
            {errors.hoverColor && <p className="text-red-500 text-sm mt-1">{errors.hoverColor.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Display Order</label>
              <input 
                type="number"
                {...register('displayOrder')}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#A83A22] focus:border-transparent outline-none transition"
                suppressHydrationWarning
              />
            </div>
            
            <div className="flex flex-col gap-4 pt-8">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" {...register('exploreMore')} className="sr-only peer" suppressHydrationWarning />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#A83A22]"></div>
                </div>
                <span className="text-sm font-medium text-gray-700">Explore More Badge</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" {...register('status')} className="sr-only peer" suppressHydrationWarning />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                </div>
                <span className="text-sm font-medium text-gray-700">Active Status</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column (Image Upload) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category Image *</label>
          <input 
            type="file" 
            accept="image/jpeg, image/png, image/webp" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileChange}
            suppressHydrationWarning
          />
          
          <input type="hidden" {...register('image')} />
          <input type="hidden" {...register('imagePublicId')} />

          {!imageUrl ? (
            <div 
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 transition-colors h-64
                ${isUploading ? 'bg-gray-50 border-gray-300 cursor-not-allowed' : 'border-gray-300 hover:border-[#A83A22] hover:bg-orange-50 cursor-pointer'}
              `}
            >
              {isUploading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="w-8 h-8 text-[#A83A22] animate-spin mb-4" />
                  <p className="text-sm text-gray-600 font-medium">Uploading {uploadProgress}%</p>
                  <div className="w-48 h-2 bg-gray-200 rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-[#A83A22] transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              ) : (
                <>
                  <UploadCloud className="w-12 h-12 text-gray-400 mb-4" />
                  <p className="text-sm font-medium text-gray-700">Click to upload image</p>
                  <p className="text-xs text-gray-500 mt-2">JPG, PNG, WEBP (Max 5MB)</p>
                </>
              )}
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-gray-200 h-64 group bg-gray-100 flex items-center justify-center">
              <Image 
                src={imageUrl} 
                alt="Category preview" 
                layout="fill"
                objectFit="cover"
                className="transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100"
                >
                  Replace
                </button>
                <button 
                  type="button"
                  onClick={removeImage}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600"
                >
                  Remove
                </button>
              </div>
            </div>
          )}
          {errors.image && <p className="text-red-500 text-sm mt-1">{errors.image.message}</p>}
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
          suppressHydrationWarning
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading || isUploading}
          className="px-6 py-2.5 bg-[#A83A22] text-white rounded-lg hover:bg-[#8e311d] transition font-medium disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          suppressHydrationWarning
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEdit ? 'Save Changes' : 'Create Category'}
        </button>
      </div>
    </form>
  );
}
