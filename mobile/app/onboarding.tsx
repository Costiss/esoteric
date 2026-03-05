import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  YStack,
  XStack,
  Button,
  H1,
  Paragraph,
  View,
} from 'tamagui';
import { Sparkles, Star, Moon, ChevronRight } from '@tamagui/lucide-icons';

const onboardingSteps = [
  {
    icon: <Sparkles size={64} color="#8B5CF6" />,
    title: 'Welcome to Esotheric',
    description: 'Discover a world of spiritual guidance and esoteric services. Connect with talented practitioners for tarot readings, astrology, reiki, and more.',
  },
  {
    icon: <Star size={64} color="#F59E0B" />,
    title: 'Verified Providers',
    description: 'All our providers are carefully verified to ensure you receive authentic and high-quality spiritual services.',
  },
  {
    icon: <Moon size={64} color="#6366F1" />,
    title: 'Book with Confidence',
    description: 'Easy booking, secure payments, and the ability to connect with practitioners who resonate with your spiritual journey.',
  },
];

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.replace('/(auth)/login');
    }
  };

  const handleSkip = () => {
    router.replace('/(auth)/login');
  };

  const step = onboardingSteps[currentStep];

  return (
    <YStack f={1} bg="$background">
      <YStack f={1} p="$6" jc="center" ai="center" space="$6">
        {/* Skip Button */}
        <Button
          position="absolute"
          top="$6"
          right="$4"
          size="$2"
          variant="outlined"
          onPress={handleSkip}
        >
          Skip
        </Button>

        {/* Icon */}
        <View
          width={140}
          height={140}
          borderRadius={70}
          bg="$backgroundHover"
          ai="center"
          jc="center"
        >
          {step.icon}
        </View>

        {/* Content */}
        <YStack space="$4" ai="center">
          <H1 color="$color" fontSize="$9" textAlign="center">
            {step.title}
          </H1>
          <Paragraph
            color="$gray10"
            fontSize="$5"
            textAlign="center"
            lineHeight={28}
          >
            {step.description}
          </Paragraph>
        </YStack>

        {/* Progress Dots */}
        <XStack space="$2">
          {onboardingSteps.map((stepData, index) => (
            <View
              key={stepData.title}
              width={10}
              height={10}
              borderRadius={5}
              bg={index === currentStep ? '$primary' : '$gray5'}
            />
          ))}
        </XStack>
      </YStack>

      {/* Bottom Button */}
      <YStack p="$6" space="$3">
        <Button
          size="$5"
          theme="active"
          iconAfter={currentStep < onboardingSteps.length - 1 ? <ChevronRight size={20} /> : undefined}
          onPress={handleNext}
        >
          {currentStep < onboardingSteps.length - 1 ? 'Next' : 'Get Started'}
        </Button>
      </YStack>
    </YStack>
  );
}
