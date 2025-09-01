#!/usr/bin/env python3
"""
Direct Tarot Card Scraper
Iterates through expected Wikimedia Commons file patterns
"""

import requests
from bs4 import BeautifulSoup
import os
import re
from urllib.parse import urljoin
import time
import json


class DirectTarotScraper:
    def __init__(self, output_dir="tarot_cards"):
        self.output_dir = output_dir
        self.commons_base = "https://commons.wikimedia.org"
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }

        # Create output directory
        os.makedirs(output_dir, exist_ok=True)

        # Major Arcana patterns and names
        self.major_arcana_patterns = [
            ("RWS_Tarot_00_Fool.jpg", "m00.jpg", "The Fool"),
            ("RWS_Tarot_01_Magician.jpg", "m01.jpg", "The Magician"),
            ("RWS_Tarot_02_High_Priestess.jpg", "m02.jpg", "The High Priestess"),
            ("RWS_Tarot_03_Empress.jpg", "m03.jpg", "The Empress"),
            ("RWS_Tarot_04_Emperor.jpg", "m04.jpg", "The Emperor"),
            ("RWS_Tarot_05_Hierophant.jpg", "m05.jpg", "The Hierophant"),
            ("RWS_Tarot_06_Lovers.jpg", "m06.jpg", "The Lovers"),
            ("RWS_Tarot_07_Chariot.jpg", "m07.jpg", "The Chariot"),
            ("RWS_Tarot_08_Strength.jpg", "m08.jpg", "Strength"),
            ("RWS_Tarot_09_Hermit.jpg", "m09.jpg", "The Hermit"),
            ("RWS_Tarot_10_Wheel_of_Fortune.jpg", "m10.jpg", "Wheel of Fortune"),
            ("RWS_Tarot_11_Justice.jpg", "m11.jpg", "Justice"),
            ("RWS_Tarot_12_Hanged_Man.jpg", "m12.jpg", "The Hanged Man"),
            ("RWS_Tarot_13_Death.jpg", "m13.jpg", "Death"),
            ("RWS_Tarot_14_Temperance.jpg", "m14.jpg", "Temperance"),
            ("RWS_Tarot_15_Devil.jpg", "m15.jpg", "The Devil"),
            ("RWS_Tarot_16_Tower.jpg", "m16.jpg", "The Tower"),
            ("RWS_Tarot_17_Star.jpg", "m17.jpg", "The Star"),
            ("RWS_Tarot_18_Moon.jpg", "m18.jpg", "The Moon"),
            ("RWS_Tarot_19_Sun.jpg", "m19.jpg", "The Sun"),
            ("RWS_Tarot_20_Judgement.jpg", "m20.jpg", "Judgement"),
            ("RWS_Tarot_21_World.jpg", "m21.jpg", "The World"),
        ]

        # Minor Arcana patterns
        self.suits = [("Wands", "w"), ("Cups", "c"), ("Swords", "s"), ("Pents", "p")]

    def get_full_resolution_from_commons(self, commons_filename):
        """Get the full resolution download URL from a Commons file page"""
        try:
            commons_url = f"{self.commons_base}/wiki/File:{commons_filename}"

            print(f"  Checking: File:{commons_filename}")
            response = requests.get(commons_url, headers=self.headers, timeout=15)

            if response.status_code == 404:
                print(f"  File not found (404)")
                return None
            elif response.status_code != 200:
                print(f"  Error {response.status_code}")
                return None

            soup = BeautifulSoup(response.content, "html.parser")

            # Look for the original file link
            original_link = soup.find("a", string=re.compile(r"Original file"))
            if original_link and original_link.get("href"):
                full_url = urljoin(self.commons_base, original_link["href"])
                print(f"  ✓ Found original file link")
                return full_url

            # Look for the main file display image
            file_img = soup.find("img", {"alt": commons_filename})
            if file_img and file_img.get("src"):
                img_src = file_img["src"]
                if img_src.startswith("//"):
                    img_src = "https:" + img_src
                elif img_src.startswith("/"):
                    img_src = self.commons_base + img_src

                # Convert thumbnail to full resolution
                full_url = re.sub(r"/thumb/(.*?)/\d+px-([^/]+)$", r"/\1/\2", img_src)
                if full_url != img_src:
                    print(f"  ✓ Converted thumbnail to full resolution")
                    return full_url
                else:
                    print(f"  ✓ Using direct image URL")
                    return full_url

            # Look for any wikimedia upload links
            upload_links = soup.find_all(
                "a",
                href=re.compile(
                    r"upload\.wikimedia\.org.*\.(jpg|jpeg|png)", re.IGNORECASE
                ),
            )
            if upload_links:
                for link in upload_links:
                    href = link["href"]
                    if href.startswith("//"):
                        href = "https:" + href
                    if "/thumb/" not in href:
                        print(f"  ✓ Found direct upload link")
                        return href

                # Use first thumbnail and convert
                first_href = upload_links[0]["href"]
                if first_href.startswith("//"):
                    first_href = "https:" + first_href
                full_url = re.sub(r"/thumb/(.*?)/\d+px-([^/]+)$", r"/\1/\2", first_href)
                print(f"  ✓ Converted thumbnail link")
                return full_url

            print(f"  ✗ No download link found")
            return None

        except Exception as e:
            print(f"  ✗ Error: {e}")
            return None

    def download_image(self, url, filename):
        """Download an image from URL and save it"""
        try:
            response = requests.get(url, stream=True, timeout=30, headers=self.headers)
            response.raise_for_status()

            filepath = os.path.join(self.output_dir, filename)

            with open(filepath, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)

            print(f"  ✓ Downloaded: {filename}")
            return True
        except Exception as e:
            print(f"  ✗ Download failed: {e}")
            return False

    def scrape_major_arcana(self):
        """Scrape all Major Arcana cards"""
        print("=== Scraping Major Arcana ===")
        downloaded = []

        for commons_filename, output_filename, card_name in self.major_arcana_patterns:
            print(f"\n[Major] {card_name}")

            # Try to get the download URL
            download_url = self.get_full_resolution_from_commons(commons_filename)

            if download_url and self.download_image(download_url, output_filename):
                downloaded.append(
                    {
                        "filename": output_filename,
                        "card_type": "major",
                        "card_name": card_name,
                        "commons_filename": commons_filename,
                        "download_url": download_url,
                    }
                )

            time.sleep(1.0)  # Be respectful

        return downloaded

    def scrape_minor_arcana(self):
        """Scrape all Minor Arcana cards"""
        print("\n=== Scraping Minor Arcana ===")
        downloaded = []

        for suit_name, suit_prefix in self.suits:
            print(f"\n--- {suit_name} ---")

            # Cards 01-14 for each suit
            for card_num in range(1, 15):
                commons_filename = f"{suit_name}{card_num:02d}.jpg"
                output_filename = f"{suit_prefix}{card_num:02d}.jpg"

                # Determine card name
                if card_num == 1:
                    card_name = f"Ace of {suit_name}"
                elif card_num == 11:
                    card_name = f"Page of {suit_name}"
                elif card_num == 12:
                    card_name = f"Knight of {suit_name}"
                elif card_num == 13:
                    card_name = f"Queen of {suit_name}"
                elif card_num == 14:
                    card_name = f"King of {suit_name}"
                else:
                    card_name = f"{card_num} of {suit_name}"

                print(f"\n[{suit_name}] {card_name}")

                # Try to get the download URL
                download_url = self.get_full_resolution_from_commons(commons_filename)

                if download_url and self.download_image(download_url, output_filename):
                    downloaded.append(
                        {
                            "filename": output_filename,
                            "card_type": "minor",
                            "card_name": card_name,
                            "commons_filename": commons_filename,
                            "download_url": download_url,
                        }
                    )

                time.sleep(1.0)  # Be respectful

        return downloaded

    def scrape_all_cards(self):
        """Scrape all tarot cards"""
        print("Starting Direct Tarot Card Scraping")
        print("===================================")

        all_downloaded = []

        # Scrape Major Arcana
        major_cards = self.scrape_major_arcana()
        all_downloaded.extend(major_cards)

        # Scrape Minor Arcana
        minor_cards = self.scrape_minor_arcana()
        all_downloaded.extend(minor_cards)

        # Save metadata
        with open(os.path.join(self.output_dir, "card_info.json"), "w") as f:
            json.dump(all_downloaded, f, indent=2)

        # Print summary
        major_count = len([c for c in all_downloaded if c["card_type"] == "major"])
        minor_count = len([c for c in all_downloaded if c["card_type"] == "minor"])

        print(f"\n" + "=" * 50)
        print(f"SCRAPING COMPLETE")
        print(f"=" * 50)
        print(f"Total downloaded: {len(all_downloaded)} cards")
        print(f"Major Arcana: {major_count}/22 cards")
        print(f"Minor Arcana: {minor_count}/56 cards")
        print(f"")
        print(f"Files saved to: {self.output_dir}/")
        print(f"Metadata saved to: {self.output_dir}/card_info.json")
        print(f"")
        print(f"Naming convention:")
        print(f"  Major Arcana: m00.jpg - m21.jpg")
        print(f"  Wands: w01.jpg - w14.jpg")
        print(f"  Cups: c01.jpg - c14.jpg")
        print(f"  Swords: s01.jpg - s14.jpg")
        print(f"  Pentacles: p01.jpg - p14.jpg")

        return all_downloaded


def main():
    """Main function"""
    scraper = DirectTarotScraper()
    results = scraper.scrape_all_cards()

    if len(results) == 78:
        print(f"\n🎉 SUCCESS: Complete deck downloaded! ({len(results)}/78 cards)")
    elif len(results) > 0:
        print(f"\n✅ PARTIAL: Downloaded {len(results)}/78 cards")
        missing = 78 - len(results)
        print(f"   {missing} cards were not available or failed to download")
    else:
        print(f"\n❌ FAILED: No cards were downloaded")


if __name__ == "__main__":
    main()
