'use client';
import { useEffect, useState } from 'react';
import { useOwnerAuth } from '@/lib/hooks/useOwnerAuth';
import { OwnerLayout } from '@/components/owner/OwnerLayout';
import { ownerAPI } from '@/lib/api/owner-client';
import styles from './Reviews.module.css';

interface Review {
  id: string;
  rating: number;
  body: string;
  approved: boolean;
  user: { email: string };
  product: { title: string };
  createdAt: string;
}

export default function ReviewsPage() {
  const { isLoading: authLoading, isOwner, user } = useOwnerAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [approved, setApproved] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    if (!isOwner) return;
    fetchReviews();
  }, [isOwner, approved]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const data = await ownerAPI.getReviews(approved, 1, 10);
      // /owner/reviews returns a bare array; tolerate {items:[...]} shapes too.
      setReviews(Array.isArray(data) ? data : (data?.items ?? []));
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await ownerAPI.approveReview(id);
      fetchReviews();
    } catch (err) {
      console.error('Failed to approve:', err);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await ownerAPI.rejectReview(id);
      fetchReviews();
    } catch (err) {
      console.error('Failed to reject:', err);
    }
  };

  if (authLoading) return <div>Loading...</div>;
  if (!isOwner) return <div>Unauthorized</div>;

  return (
    <OwnerLayout user={user}>
      <div className={styles.container}>
        <h1>Reviews Management</h1>

        <div className={styles.tabs}>
          <button
            onClick={() => setApproved(undefined)}
            className={`${styles.tab} ${approved === undefined ? styles.active : ''}`}
          >
            All
          </button>
          <button
            onClick={() => setApproved(true)}
            className={`${styles.tab} ${approved === true ? styles.active : ''}`}
          >
            Approved
          </button>
          <button
            onClick={() => setApproved(false)}
            className={`${styles.tab} ${approved === false ? styles.active : ''}`}
          >
            Pending
          </button>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className={styles.empty}>No reviews found</div>
        ) : (
          <div className={styles.reviewsList}>
            {reviews.map((review) => (
              <div key={review.id} className={styles.reviewCard}>
                <div className={styles.reviewHeader}>
                  <div>
                    <p className={styles.product}>{review.product?.title}</p>
                    <p className={styles.user}>{review.user?.email}</p>
                  </div>
                  <div className={styles.rating}>
                    {'⭐'.repeat(review.rating)}
                  </div>
                </div>
                <p className={styles.body}>{review.body}</p>
                <div className={styles.actions}>
                  {!review.approved && (
                    <>
                      <button
                        onClick={() => handleApprove(review.id)}
                        className={styles.approveBtn}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(review.id)}
                        className={styles.rejectBtn}
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {review.approved && (
                    <span className={styles.approvedBadge}>Approved ✓</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </OwnerLayout>
  );
}
