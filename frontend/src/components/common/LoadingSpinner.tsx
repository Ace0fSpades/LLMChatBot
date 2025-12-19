import styles from './LoadingSpinner.module.scss';

/**
 * Loading spinner component
 */
export const LoadingSpinner = () => {
  return (
    <div className={styles['loading-spinner']}>
      <div className={styles.spinner}></div>
    </div>
  );
};

