import { useState } from 'react';
import { X, DollarSign, Calendar } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import * as Dialog from '@radix-ui/react-dialog';
import { format } from 'date-fns';

// Types
type Course = {
  id: number;
  name: string;
  instructor: string;
  duration: string;
  price: number;
  description: string;
  level: string;
};

type PaymentFormData = {
  amount: string;
  dateApproved: string;
  datePaid: string;
};

// Sample courses data
const sampleCourses: Course[] = [
  {
    id: 1,
    name: 'Story Development',
    instructor: 'Jane Smith',
    duration: '6 weeks',
    price: 5000,
    description: 'Learn the fundamentals of storytelling and narrative structure.',
    level: 'Beginner',
  },
  {
    id: 2,
    name: 'Animation Basics',
    instructor: 'John Doe',
    duration: '8 weeks',
    price: 7500,
    description: 'Introduction to animation principles and key frame techniques.',
    level: 'Beginner',
  },
  {
    id: 3,
    name: 'Game Design',
    instructor: 'Alex Johnson',
    duration: '10 weeks',
    price: 9000,
    description: 'Master game design mechanics and player psychology.',
    level: 'Intermediate',
  },
  {
    id: 4,
    name: 'Python Programming',
    instructor: 'Sarah Williams',
    duration: '12 weeks',
    price: 8500,
    description: 'Complete guide to Python programming from scratch.',
    level: 'Beginner',
  },
];

// Payment Modal Component
interface PaymentModalProps {
  isOpen: boolean;
  course: Course | null;
  onClose: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, course, onClose }) => {
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'cash'>('mpesa');
  const [formData, setFormData] = useState<PaymentFormData>({
    amount: course?.price.toString() || '',
    dateApproved: format(new Date(), 'yyyy-MM-dd'),
    datePaid: format(new Date(), 'yyyy-MM-dd'),
  });
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    // Here you would normally submit the payment data to your backend
    console.log('Payment submitted:', { paymentMethod, ...formData });
    
    // Optionally close modal after successful submission
    setTimeout(() => {
      onClose();
      setSubmitted(false);
      setFormData({
        amount: course?.price.toString() || '',
        dateApproved: format(new Date(), 'yyyy-MM-dd'),
        datePaid: format(new Date(), 'yyyy-MM-dd'),
      });
    }, 1500);
  };

  if (!isOpen || !course) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        {/* Dark overlay background */}
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />

        {/* Modal content */}
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-2xl font-bold">Payment for {course.name}</Dialog.Title>
            <button
              onClick={onClose}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Course Summary */}
          <Card className="mb-6 p-4 bg-gray-50">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Course:</span>
                <span className="font-semibold">{course.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Instructor:</span>
                <span className="font-semibold">{course.instructor}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-semibold text-gray-700">Default Amount:</span>
                <span className="text-xl font-bold text-blue-600">KSh {course.price.toLocaleString()}</span>
              </div>
            </div>
          </Card>

          {/* Payment Method Selection */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Select Payment Method</h3>
            <div className="space-y-2">
              {[
                { id: 'mpesa', label: 'M-Pesa', icon: '📱' },
                { id: 'cash', label: 'Cash', icon: '💰' },
              ].map((method) => (
                <label key={method.id} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment-method"
                    value={method.id}
                    checked={paymentMethod === method.id}
                    onChange={(e) => setPaymentMethod(e.target.value as 'mpesa' | 'cash')}
                    className="h-4 w-4"
                  />
                  <span className="ml-3 text-lg">{method.icon}</span>
                  <span className="ml-2 font-medium">{method.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              {/* Amount Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Amount (KSh)
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter amount"
                />
              </div>

              {/* Date Approved Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Date Approved
                </label>
                <input
                  type="date"
                  name="dateApproved"
                  value={formData.dateApproved}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Date Paid Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Date Paid
                </label>
                <input
                  type="date"
                  name="datePaid"
                  value={formData.datePaid}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Payment Method Specific Instructions */}
              {paymentMethod === 'mpesa' && (
                <div className="mt-4 p-3 bg-white rounded border border-blue-300">
                  <p className="font-semibold mb-2 text-gray-700">M-Pesa Instructions:</p>
                  <ol className="text-sm space-y-1 list-decimal list-inside text-gray-600">
                    <li>Open M-Pesa on your phone</li>
                    <li>Select "Lipa Na M-Pesa Online"</li>
                    <li>Enter business code: 174379</li>
                    <li>Enter amount: KSh {formData.amount}</li>
                    <li>Enter your PIN to confirm</li>
                  </ol>
                </div>
              )}

              {paymentMethod === 'cash' && (
                <div className="mt-4 p-3 bg-white rounded border border-blue-300">
                  <p className="font-semibold mb-2 text-gray-700">Cash Payment Information:</p>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• Amount: <span className="font-semibold">KSh {formData.amount}</span></li>
                    <li>• Date Approved: <span className="font-semibold">{formData.dateApproved}</span></li>
                    <li>• Date Paid: <span className="font-semibold">{formData.datePaid}</span></li>
                  </ul>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                {submitted ? 'Processing...' : 'Confirm Payment'}
              </Button>
            </div>

            {submitted && (
              <div className="mt-4 p-3 bg-green-100 border border-green-500 rounded-md text-green-700 text-sm font-semibold">
                ✓ Payment submitted successfully!
              </div>
            )}
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

// Main Component
export const CoursesWithPayment: React.FC = () => {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const handlePayMentor = (course: Course) => {
    setSelectedCourse(course);
    setIsPaymentModalOpen(true);
  };

  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {selectedCourse ? (
          // Course Details View
          <div>
            <button
              onClick={() => setSelectedCourse(null)}
              className="mb-6 text-blue-600 hover:text-blue-800 font-semibold flex items-center"
            >
              ← Back to Courses
            </button>

            <Card className="p-8 relative">
              <div className="mb-6">
                <h1 className="text-4xl font-bold mb-2">{selectedCourse.name}</h1>
                <p className="text-gray-600">Level: {selectedCourse.level}</p>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Instructor</h3>
                  <p className="text-lg">{selectedCourse.instructor}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Duration</h3>
                  <p className="text-lg">{selectedCourse.duration}</p>
                </div>
                <div className="col-span-2">
                  <h3 className="font-semibold text-gray-700 mb-2">Description</h3>
                  <p className="text-gray-600 leading-relaxed">{selectedCourse.description}</p>
                </div>
              </div>

              <div className="border-t pt-6 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">Course Price:</span>
                  <span className="text-4xl font-bold text-blue-600">KSh {selectedCourse.price.toLocaleString()}</span>
                </div>
              </div>

              <Button
                onClick={() => handlePayMentor(selectedCourse)}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-semibold"
              >
                <DollarSign className="h-5 w-5 mr-2" />
                Pay Mentor
              </Button>

              {/* Payment Modal - appears on top of course card */}
              <PaymentModal isOpen={isPaymentModalOpen} course={selectedCourse} onClose={handleClosePaymentModal} />
            </Card>
          </div>
        ) : (
          // Course List View
          <div>
            <h1 className="text-3xl font-bold mb-8 text-gray-800">Available Courses</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sampleCourses.map((course) => (
                <Card
                  key={course.id}
                  onClick={() => setSelectedCourse(course)}
                  className="cursor-pointer hover:shadow-lg transition-shadow p-6 hover:border-blue-500"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h2 className="text-xl font-bold flex-1">{course.name}</h2>
                    <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full whitespace-nowrap ml-2">
                      {course.level}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-2">
                    <span className="font-semibold">Instructor:</span> {course.instructor}
                  </p>
                  <p className="text-gray-600 mb-4">
                    <span className="font-semibold">Duration:</span> {course.duration}
                  </p>

                  <p className="text-gray-700 mb-4 line-clamp-2">{course.description}</p>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-2xl font-bold text-blue-600">KSh {course.price.toLocaleString()}</span>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">View Details →</Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
