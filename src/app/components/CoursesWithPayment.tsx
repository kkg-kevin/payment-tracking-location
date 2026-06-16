import { useState } from 'react';
import { X, DollarSign } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import * as Dialog from '@radix-ui/react-dialog';

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
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'card' | 'bank'>('mpesa');

  if (!isOpen || !course) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        {/* Dark overlay background */}
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />

        {/* Modal content */}
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
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
                <span className="font-semibold text-gray-700">Amount:</span>
                <span className="text-xl font-bold text-blue-600">KSh {course.price.toLocaleString()}</span>
              </div>
            </div>
          </Card>

          {/* Payment Method Selection */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Select Payment Method</h3>
            <div className="space-y-3">
              {[
                { id: 'mpesa', label: 'M-Pesa', icon: '📱' },
                { id: 'card', label: 'Credit/Debit Card', icon: '💳' },
                { id: 'bank', label: 'Bank Transfer', icon: '🏦' },
              ].map((method) => (
                <label key={method.id} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment-method"
                    value={method.id}
                    checked={paymentMethod === method.id}
                    onChange={(e) => setPaymentMethod(e.target.value as 'mpesa' | 'card' | 'bank')}
                    className="h-4 w-4"
                  />
                  <span className="ml-3 text-lg">{method.icon}</span>
                  <span className="ml-2 font-medium">{method.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Payment Method Details */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            {paymentMethod === 'mpesa' && (
              <div>
                <p className="font-semibold mb-2">M-Pesa Instructions:</p>
                <ol className="text-sm space-y-1 list-decimal list-inside">
                  <li>Open M-Pesa on your phone</li>
                  <li>Select "Lipa Na M-Pesa Online"</li>
                  <li>Enter business code: 174379</li>
                  <li>Enter amount: KSh {course.price}</li>
                  <li>Enter your PIN</li>
                </ol>
              </div>
            )}
            {paymentMethod === 'card' && (
              <div>
                <p className="font-semibold mb-2">Card Details:</p>
                <p className="text-sm mb-3">You will be redirected to a secure payment gateway.</p>
              </div>
            )}
            {paymentMethod === 'bank' && (
              <div>
                <p className="font-semibold mb-2">Bank Details:</p>
                <div className="text-sm space-y-1">
                  <p><span className="font-medium">Bank:</span> KCB Bank Kenya</p>
                  <p><span className="font-medium">Account:</span> 1234567890</p>
                  <p><span className="font-medium">Reference:</span> COURSE-{course.id}</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
              <DollarSign className="h-4 w-4 mr-2" />
              Proceed to Payment
            </Button>
          </div>
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
