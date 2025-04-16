/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/destructuring-assignment */
import Image from 'next/image';

export type ImageProps = React.ComponentProps<typeof Image>;

export default function BaseImage(props: ImageProps) {
  return (
    <Image
      {...props}
      alt={props.alt || (props.title as string)}
      loading={props.loading || 'lazy'}
      sizes={props.sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
      quality={props.quality || 80}
    />
  );
}
