import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";
import * as React from "react";

interface AbandonedCartEmailProps {
  customerName: string;
  checkoutUrl: string;
  discountCode?: string;
}

export const AbandonedCartEmail = ({
  customerName = "Valued Customer",
  checkoutUrl = "https://mangobite.com/checkout",
  discountCode = "COMEBACK5",
}: AbandonedCartEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Did you forget something? Complete your MangoBite order!</Preview>
      <Tailwind>
        <Body className="bg-[#f4f7f5] my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#e6ebec] rounded my-[40px] mx-auto p-[20px] max-w-[465px] bg-white">
            <Section className="mt-[32px] text-center">
              <Img
                src="https://images.unsplash.com/photo-1553279768-865429fa0078?w=200&h=200&fit=crop&q=80"
                width="80"
                height="80"
                alt="MangoBite"
                className="my-0 mx-auto rounded-full"
              />
            </Section>
            
            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0 font-serif">
              You left something behind!
            </Heading>

            <Text className="text-black text-[14px] leading-[24px]">
              Hello {customerName},
            </Text>

            <Text className="text-black text-[14px] leading-[24px]">
              We noticed you added some premium Rajshahi mangoes to your cart but didn't complete your order. Our mangoes are harvested fresh and sell out fast!
            </Text>

            <Text className="text-black text-[14px] leading-[24px] font-bold">
              As a special treat, use code <span className="bg-[#fbbf24] px-2 py-1 rounded text-black">{discountCode}</span> at checkout for an extra 5% off your entire order.
            </Text>

            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-[#20BA5A] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href={checkoutUrl}
              >
                Complete My Order
              </Button>
            </Section>

            <Text className="text-black text-[14px] leading-[24px]">
              If you have any questions or need help with your order, simply reply to this email or chat with us on WhatsApp.
            </Text>

            <Text className="text-[#666666] text-[12px] leading-[24px] mt-[32px]">
              Best regards,<br />
              The MangoBite Team
            </Text>

            <Section className="text-center mt-[32px] border-t border-solid border-[#e6ebec] pt-[32px]">
              <Text className="text-[#999999] text-[10px] leading-[24px]">
                You received this email because you recently added items to your cart at MangoBite.
                <br />
                <a href={`${checkoutUrl.replace('/checkout', '')}/unsubscribe`} className="text-[#999999] underline">
                  Unsubscribe from cart reminders
                </a>
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default AbandonedCartEmail;
