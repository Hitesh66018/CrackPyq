'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import toast from 'react-hot-toast';

function ToastLogic() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const message = searchParams.get('message');
    if (message) {
      if (message.toLowerCase().includes('success') || message.toLowerCase().includes('check your email')) {
        toast.success(message, { duration: 5000 });
      } else {
        toast.error(message, { duration: 5000 });
      }

      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete('message');
      const newUrl = newParams.toString() ? `${pathname}?${newParams.toString()}` : pathname;
      router.replace(newUrl, { scroll: false });
    }
  }, [searchParams, router, pathname]);

  return null;
}

export function FormMessageToast() {
  return (
    <Suspense fallback={null}>
      <ToastLogic />
    </Suspense>
  );
}
