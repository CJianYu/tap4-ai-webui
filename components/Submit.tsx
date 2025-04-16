import React from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'react-hot-toast';

export default function Submit() {
  const t = useTranslations('common');
  const websiteName = t('Submit.website');
  const websiteUrl = t('Submit.url');
  const submitButton = t('Submit.submit');

  const handleClick = async (formData: FormData) => {
    const formName = formData.get('name')?.toString();
    const formUrl = formData.get('url')?.toString();
    if (!formName || !formUrl) {
      return {
        message: t('Submit.networkError'),
      };
    }

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formName,
          url: formUrl,
        }),
      });
      const data = await response.json();

      if (data.message === 'success') {
        toast.success(t('Submit.success'));
      } else {
        toast.error(t('Submit.networkError'));
      }
      return { success: true };
    } catch (error) {
      console.error(error);
      toast.error(t('Submit.networkError'));
      return { success: false };
    }
  };

  return (
    <>
      <section className='page-header section-padding'>
        <div className='container'>
          <div className='row justify-content-center'>
            <div className='col-lg-8'>
              <div className='text-center'>
                <h1 className='display-4 fw-bold'>{t('Submit.title')}</h1>
                <p className='lead'>{t('Submit.subTitle')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className='section-padding'>
        <div className='container'>
          <div className='row justify-content-center'>
            <div className='col-lg-8'>
              <div className='card'>
                <div className='card-body'>
                  <form action={handleClick}>
                    <div className='mb-3'>
                      <label htmlFor='name' className='form-label'>
                        {websiteName}
                      </label>
                      <input
                        type='text'
                        className='form-control'
                        id='name'
                        name='name'
                        placeholder='AI Save World'
                        required
                      />
                    </div>

                    <div className='mb-3'>
                      <label htmlFor='url' className='form-label'>
                        {websiteUrl}
                      </label>
                      <input
                        type='url'
                        className='form-control'
                        id='url'
                        name='url'
                        placeholder='https://www.aisaveworld.com/'
                        required
                      />
                    </div>

                    <div className='mb-3'>
                      <p>
                        {t('Submit.add')}{' '}
                        <code>
                          {
                            "<a href='https://www.aisaveworld.com/' title='AI Save World Tools Directory'>AI Save World Tools Directory</a>"
                          }
                        </code>{' '}
                        {t('Submit.text')}
                      </p>
                    </div>

                    <div className='text-center'>
                      <button type='submit' className='btn btn-primary'>
                        {submitButton}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
