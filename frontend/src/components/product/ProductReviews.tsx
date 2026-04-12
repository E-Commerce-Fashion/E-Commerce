'use client'

import { useEffect, useState } from 'react'
import { Star, User, Trash2, ShieldCheck, MoreVertical, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatCurrency, formatDate } from '@/utils'
import api from '@/lib/axios'
import { useUserStore } from '@/store/userStore'
import { toast } from 'react-hot-toast'

interface Review {
  id: string
  rating: number
  comment: string
  created_at: string
  user_id: string
  profiles: {
    name: string
    avatar_url?: string
  }
}

export function ProductReviews({ productId }: { productId: string }) {
  const { user, isAuthenticated } = useUserStore()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [hoverRating, setHoverRating] = useState(0)

  const fetchReviews = async () => {
    try {
      const { data } = await api.get(`/reviews/${productId}`)
      if (data.success) setReviews(data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [productId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) return toast.error('Please login to write a review')
    if (!comment.trim()) return toast.error('Please add a comment')

    setSubmitting(true)
    try {
      const { data } = await api.post(`/reviews/${productId}`, { rating, comment })
      if (data.success) {
        toast.success('Review submitted!')
        setComment('')
        setRating(5)
        fetchReviews()
      }
    } catch (err) {
      toast.error('Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Delete this review?')) return
    try {
      const { data } = await api.delete(`/reviews/${reviewId}`)
      if (data.success) {
        toast.success('Review deleted')
        fetchReviews()
      }
    } catch (err) {
      toast.error('Failed to delete review')
    }
  }

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  return (
    <section className="mt-20 pt-10" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="grid lg:grid-cols-3 gap-16">
        {/* Review Summary & Form */}
        <div className="lg:col-span-1 space-y-10">
          <div>
            <h3 className="text-2xl font-bold font-serif mb-4" style={{ color: 'var(--text-primary)' }}>Customer Reviews</h3>
            {reviews.length > 0 ? (
              <div className="flex items-center gap-4">
                <span className="text-5xl font-bold" style={{ color: 'var(--accent-gold)' }}>{avgRating.toFixed(1)}</span>
                <div>
                   <div className="flex mb-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star key={i} size={16} fill={i <= Math.round(avgRating) ? 'var(--accent-gold)' : 'none'} stroke="var(--accent-gold)" />
                      ))}
                   </div>
                   <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Based on {reviews.length} reviews</p>
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No reviews yet. Be the first to share your experience!</p>
            )}
          </div>

          {/* Review Form */}
          <div className="p-8 rounded-3xl border relative overflow-hidden group" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
             <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-focus-within:opacity-[0.08] transition-opacity">
                <Sparkles size={120} className="text-(--accent-gold)" />
             </div>
            <h4 className="text-lg font-bold mb-6 font-serif" style={{ color: 'var(--text-primary)' }}>Share Your Thoughts</h4>
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-3" style={{ color: 'var(--text-muted)' }}>Quality Assessment</p>
                <div className="flex gap-2.5">
                  {[1, 2, 3, 4, 5].map(i => (
                    <button
                      key={i}
                      type="button"
                      onMouseEnter={() => setHoverRating(i)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(i)}
                      className="transition-all active:scale-95 hover:scale-110"
                    >
                      <Star 
                        size={28} 
                        fill={(hoverRating || rating) >= i ? 'var(--accent-gold)' : 'none'} 
                        stroke="var(--accent-gold)" 
                        className="cursor-pointer"
                        style={{ filter: (hoverRating || rating) >= i ? 'drop-shadow(0 0 8px rgba(var(--accent-gold-rgb), 0.4))' : 'none' }}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-3" style={{ color: 'var(--text-muted)' }}>Detailed Feedback</p>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us about the fit, feel, and finish..."
                  rows={4}
                  className="w-full px-5 py-4 rounded-2xl bg-white/3 border text-sm transition-all focus:border-(--accent-gold) focus:bg-white/5 outline-none"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-14 rounded-2xl font-black text-[10px] uppercase tracking-[0.25em] transition-all active:scale-95 disabled:opacity-50 hover:shadow-[0_12px_30px_rgba(var(--accent-gold-rgb),0.2)]"
                style={{ background: 'var(--accent-gold)', color: '#0A0A0F' }}
              >
                {submitting ? 'Authenticating...' : 'Publish Experience'}
              </button>
            </form>
          </div>
        </div>

        {/* Reviews List */}
        <div className="lg:col-span-2">
           <div className="space-y-8">
             {loading ? (
                [1, 2].map(i => <div key={i} className="h-32 skeleton rounded-2xl" />)
             ) : reviews.length > 0 ? (
               reviews.map((rev, idx) => (
                 <motion.div 
                   key={rev.id} 
                   initial={{ opacity: 0, x: 20 }} 
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ duration: 0.5, delay: idx * 0.08 }}
                   className="pb-10 border-b last:border-0 relative group" 
                   style={{ borderColor: 'var(--border)' }}
                 >
                   <div className="flex items-center justify-between mb-5">
                     <div className="flex items-center gap-4">
                        <div className="relative w-14 h-14 rounded-full p-0.5 border-2 border-(--accent-gold)/20 group-hover:border-(--accent-gold)/40 transition-colors">
                          <div className="w-full h-full rounded-full flex items-center justify-center bg-white/5 overflow-hidden">
                             {rev.profiles?.avatar_url ? (
                               <img src={rev.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                             ) : (
                               <User size={24} style={{ color: 'var(--text-muted)' }} />
                             )}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold font-serif" style={{ color: 'var(--text-primary)' }}>
                              {rev.profiles?.name}
                            </p>
                            {rev.user_id === user?.id && (
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-(--accent-gold)/10 text-(--accent-gold) border border-(--accent-gold)/20">
                                Your Editorial
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] font-medium uppercase tracking-widest mt-1 opacity-50" style={{ color: 'var(--text-muted)' }}>
                            {formatDate(rev.created_at)} • Verified Purchase
                          </p>
                        </div>
                     </div>
                     {(rev.user_id === user?.id || user?.role === 'admin') && (
                       <button onClick={() => handleDelete(rev.id)} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-red-500/10 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100">
                         <Trash2 size={15} />
                       </button>
                     )}
                   </div>
                   <div className="flex mb-4 gap-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star key={i} size={11} fill={i <= rev.rating ? 'var(--accent-gold)' : 'none'} stroke="var(--accent-gold)" />
                      ))}
                   </div>
                   <p className="text-sm leading-relaxed max-w-2xl font-medium" style={{ color: 'var(--text-secondary)' }}>
                       {rev.comment}
                   </p>
                 </motion.div>
               ))
             ) : (
               <div className="py-20 text-center opacity-30">
                 <ShieldCheck size={48} className="mx-auto mb-4" />
                 <p>Experience the quality, leave a review.</p>
               </div>
             )}
           </div>
        </div>
      </div>
    </section>
  )
}
