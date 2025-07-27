import React from 'react';
import Head from 'next/head';
import TabNavigation from '../components/TabNavigation';
import DestinyDataViewer from '../components/DestinyDataViewer';

export default function DestinyDataPage() {
  return (
    <>
      <Head>
        <title>Destiny Data - Casting Destiny</title>
        <meta name="description" content="View all Destiny 2 data pulled from Bungie API" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
        color: '#e6e6e6'
      }}>
        {/* Tab Navigation */}
        <TabNavigation />
        
        {/* Main Content */}
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '20px'
        }}>
          <DestinyDataViewer />
        </div>
      </div>
    </>
  );
}