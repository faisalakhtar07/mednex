import { useState } from 'react'
import { Star } from 'lucide-react'
import Modal from './Modal.jsx'
import Button from './Button.jsx'
import { api } from '../utils/api.js'
import { useToast } from '../context/ToastContext.jsx'

// Opened from MyAppointments.jsx for any completed-but-unreviewed
// appointment. On success calls onSubmitted() so the parent can refresh its
// list (flips appointment.reviewed to true and hides the CTA).
export default function ReviewModal({ appointment, onClose, onSubmitted }) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()

  const submit = async () => {
    if (rating === 0) {
      showToast('Please select a star rating')
      return
    }
    setSaving(true)
    try {
      await api.submitReview({ appointmentId: appointment.id, rating, comment: comment.trim() })
      showToast('Thanks for your review!')
      onSubmitted?.()
      onClose()
    } catch (err) {
      showToast(err.message || 'Could not submit review')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={!!appointment} onClose={onClose} title="Rate your visit">
      <p className="text-sm text-navy-900/60 mb-4">How was your appointment with {appointment?.doctorId?.name || 'the doctor'}?</p>
      <div className="flex items-center justify-center gap-1.5 mb-5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHoverRating(n)}
            onMouseLeave={() => setHoverRating(0)}
            className="focus-ring p-1"
            aria-label={`${n} star${n === 1 ? '' : 's'}`}
          >
            <Star size={32} className={(hoverRating || rating) >= n ? 'text-amber-500 fill-amber-500' : 'text-navy-900/15'} />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share more about your experience (optional)"
        rows={3}
        maxLength={1000}
        className="focus-ring w-full border border-navy-900/15 rounded-lg px-3.5 py-2.5 text-sm mb-4"
      />
      <Button className="w-full" onClick={submit} disabled={saving}>
        {saving ? 'Submitting...' : 'Submit Review'}
      </Button>
    </Modal>
  )
}
